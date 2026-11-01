// Accounts: any email + password (min 8), verified with a 6-digit code sent by
// email before the first session. Session in a signed httpOnly cookie
// (lib/session/user.ts). See docs/DECISIONS.md -> "Cuentas".
//
// NOT IMPLEMENTED (MVP): password reset and the ADMIN role from ADMIN_EMAILS.

import { createHmac, randomInt } from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { getEmailSender } from "@/lib/auth/email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { FREE_ATTEMPTS, clearFailures, getLockSeconds, recordFailure } from "@/lib/auth/throttle";
import type { LoginInput, RegisterInput, VerifyInput } from "@/lib/validation/auth";

export const CODE_TTL_MS = 10 * 60_000;
export const CODE_RESEND_COOLDOWN_MS = 60_000;
export const CODE_MAX_ATTEMPTS = 5;

/** Fields of a user that are safe to send to the browser. */
export interface PublicAccount {
  id: string;
  email: string;
  name: string | null;
}

export function toPublicAccount(user: User): PublicAccount | null {
  return user.email && user.emailVerifiedAt ? { id: user.id, email: user.email, name: user.name } : null;
}

// Verified against when the email does not exist, so a failed login takes the
// same time whether or not the account exists.
let dummyHash: Promise<string> | null = null;

function hashCode(email: string, code: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(`${email}:${code}`).digest("base64url");
}

/**
 * Creates (or, if still unverified, replaces) an account and emails a code.
 * No session is started until the code is verified.
 */
export async function registerAccount(input: RegisterInput): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing?.emailVerifiedAt) throw new HttpError(409, "Ya existe una cuenta con ese correo");

  const data = { name: input.name, passwordHash: await hashPassword(input.password) };
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data })
    : await prisma.user.create({ data: { ...data, email: input.email, deviceId: crypto.randomUUID() } });

  // Re-registering inside the cooldown keeps the code that was already sent.
  await issueCode(user);
}

/** Emails a new code to an unverified account. Silent for unknown or verified emails. */
export async function resendCode(email: string): Promise<{ retryAfter: number }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || user.emailVerifiedAt) return { retryAfter: Math.ceil(CODE_RESEND_COOLDOWN_MS / 1000) };
  return issueCode(user);
}

/**
 * Sends a fresh code unless one was sent less than CODE_RESEND_COOLDOWN_MS
 * ago. Older unconsumed codes are invalidated.
 */
async function issueCode(user: User, now = new Date()): Promise<{ retryAfter: number }> {
  const email = user.email!;
  const last = await prisma.loginCode.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const sinceLast = last ? now.getTime() - last.createdAt.getTime() : Infinity;
  if (sinceLast < CODE_RESEND_COOLDOWN_MS) {
    return { retryAfter: Math.ceil((CODE_RESEND_COOLDOWN_MS - sinceLast) / 1000) };
  }

  const sender = getEmailSender();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.$transaction([
    prisma.loginCode.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: now } }),
    prisma.loginCode.create({
      data: { email, userId: user.id, codeHash: hashCode(email, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS) },
    }),
  ]);
  await sender.sendVerificationCode(email, code);
  return { retryAfter: Math.ceil(CODE_RESEND_COOLDOWN_MS / 1000) };
}

/** Checks the emailed code, marks the email verified and merges the device user. */
export async function verifyEmail(input: VerifyInput, current: User | null): Promise<User> {
  const invalid = new HttpError(400, "Código inválido o vencido. Pide uno nuevo.");
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw invalid;

  const code = await prisma.loginCode.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!code) throw invalid;
  if (code.attempts >= CODE_MAX_ATTEMPTS) {
    throw new HttpError(429, "Demasiados intentos con este código. Pide uno nuevo.");
  }
  if (code.codeHash !== hashCode(input.email, input.code)) {
    await prisma.loginCode.update({ where: { id: code.id }, data: { attempts: { increment: 1 } } });
    const left = CODE_MAX_ATTEMPTS - code.attempts - 1;
    throw new HttpError(400, left > 0 ? `Código incorrecto. Te quedan ${left} intentos.` : "Código incorrecto. Pide uno nuevo.");
  }

  const [, verified] = await prisma.$transaction([
    prisma.loginCode.update({ where: { id: code.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date() } }),
  ]);
  if (current && !current.email && current.id !== verified.id) {
    await mergeDeviceUser(current.id, verified.id);
  }
  return verified;
}

/**
 * Checks the credentials with a progressive lockout per email (lib/auth/throttle.ts).
 * Unverified accounts get a new code and a 403 asking to verify. On success
 * the current anonymous device user is merged into the account.
 */
export async function loginAccount(input: LoginInput, current: User | null): Promise<User> {
  const lock = await getLockSeconds(input.email);
  if (lock > 0) {
    throw new HttpError(429, "Demasiados intentos fallidos. Espera antes de volver a intentar.", { retryAfter: lock });
  }

  const account = await prisma.user.findUnique({ where: { email: input.email } });
  const ok = account?.passwordHash
    ? await verifyPassword(input.password, account.passwordHash)
    : await verifyPassword(input.password, await (dummyHash ??= hashPassword("dummy-password"))).then(() => false);

  if (!account || !ok) {
    const { failures, lockSeconds } = await recordFailure(input.email);
    if (lockSeconds > 0) {
      throw new HttpError(429, "Correo o contraseña incorrectos. Espera antes de volver a intentar.", {
        retryAfter: lockSeconds,
      });
    }
    const left = FREE_ATTEMPTS - failures;
    throw new HttpError(401, `Correo o contraseña incorrectos. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.`);
  }
  await clearFailures(input.email);

  if (!account.emailVerifiedAt) {
    await issueCode(account);
    throw new HttpError(403, "Verifica tu correo: te enviamos un código.", { verificationRequired: true });
  }

  if (current && !current.email && current.id !== account.id) {
    await mergeDeviceUser(current.id, account.id);
  }
  return account;
}

/**
 * Moves the device user's push subscriptions, interactions, deliveries,
 * reports and (if the account has none) topics to the account, then deletes it.
 */
async function mergeDeviceUser(fromId: string, toId: string): Promise<void> {
  const accountTopics = await prisma.userTopic.count({ where: { userId: toId } });
  await prisma.$transaction([
    prisma.pushSubscription.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
    prisma.interaction.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
    prisma.pushDelivery.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
    prisma.report.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
    ...(accountTopics === 0
      ? [prisma.userTopic.updateMany({ where: { userId: fromId }, data: { userId: toId } })]
      : []),
    // Cascades whatever was not moved (topics when the account had its own, pending jobs).
    prisma.user.delete({ where: { id: fromId } }),
  ]);
}
