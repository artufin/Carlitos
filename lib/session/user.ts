import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  signDeviceId,
  signSession,
  verifyDeviceCookie,
  verifySessionCookie,
} from "@/lib/session/cookie";

export class SessionMissingError extends Error {
  constructor() {
    super("No device session cookie present");
    this.name = "SessionMissingError";
  }
}

/** Reads and verifies the device id from the signed cookie (set by proxy.ts). */
export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(DEVICE_COOKIE)?.value;
  return verifyDeviceCookie(value, getEnv().SESSION_SECRET);
}

/** Reads and verifies the logged-in user id from the account session cookie. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return verifySessionCookie(value, getEnv().SESSION_SECRET);
}

/**
 * Returns the current user: the logged-in account when the session cookie is
 * valid, otherwise the anonymous user for this device (created on first use).
 * Everything user-scoped (preferences, push subscriptions, reports) hangs off
 * the returned row, so callers never need to know which kind it is.
 */
export async function getCurrentUser(): Promise<User | null> {
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) {
    const account = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (account) return account;
  }

  const deviceId = await getDeviceId();
  if (!deviceId) return null;
  return prisma.user.upsert({
    where: { deviceId },
    update: {},
    create: { deviceId },
  });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new SessionMissingError();
  return user;
}

const baseCookie = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

/** Sets the account session cookie. Only callable from route handlers and server actions. */
export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set({
    ...baseCookie,
    name: SESSION_COOKIE,
    value: await signSession(userId, getEnv().SESSION_SECRET),
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

/** Clears the account session cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Gives this browser a brand-new anonymous device id. Used after register and
 * logout so the old device id (now owned by an account) can no longer be used
 * to reach that account without the session cookie.
 */
export async function rotateDeviceId(): Promise<void> {
  const store = await cookies();
  store.set({
    ...baseCookie,
    name: DEVICE_COOKIE,
    value: await signDeviceId(crypto.randomUUID(), getEnv().SESSION_SECRET),
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
}
