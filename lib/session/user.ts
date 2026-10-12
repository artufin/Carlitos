import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { DEVICE_COOKIE, verifyDeviceCookie } from "@/lib/session/cookie";

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

/**
 * Returns the anonymous user for this device, creating it on first use.
 * Everything user-scoped (preferences, push subscriptions, reports) hangs off
 * this row. When real auth lands, the device user is migrated to the real
 * user (see docs/DECISIONS.md -> "Identidad").
 */
export async function getCurrentUser(): Promise<User | null> {
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
