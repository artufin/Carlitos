import { prisma } from "@/lib/db";

// Progressive lockout for password logins, per email: the first
// FREE_ATTEMPTS failures are free; from then on each failure locks the email
// for BASE_LOCK_MS, doubling every time, up to MAX_LOCK_MS. A successful login
// clears it, and failures older than RESET_AFTER_MS are forgotten.

export const FREE_ATTEMPTS = 3;
export const BASE_LOCK_MS = 30_000;
export const MAX_LOCK_MS = 15 * 60_000;
export const RESET_AFTER_MS = 24 * 60 * 60_000;

/** Lock length after the given total number of consecutive failures: 0, 0, 30 s, 1 min, 2 min, … 15 min. */
export function lockDurationMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(BASE_LOCK_MS * 2 ** (failures - FREE_ATTEMPTS), MAX_LOCK_MS);
}

export interface ThrottleState {
  failures: number;
  lockedUntil: Date | null;
  updatedAt: Date;
}

/** State after one more failure. Pure, so it can be unit tested. */
export function nextFailureState(previous: ThrottleState | null, now: Date): { failures: number; lockedUntil: Date | null } {
  const stale = !previous || now.getTime() - previous.updatedAt.getTime() > RESET_AFTER_MS;
  const failures = (stale ? 0 : previous.failures) + 1;
  const lock = lockDurationMs(failures);
  return { failures, lockedUntil: lock > 0 ? new Date(now.getTime() + lock) : null };
}

/** Seconds left on the lock (rounded up), or 0 when not locked. */
export function secondsLeft(lockedUntil: Date | null, now: Date): number {
  if (!lockedUntil) return 0;
  return Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

export async function getLockSeconds(email: string, now = new Date()): Promise<number> {
  const row = await prisma.loginThrottle.findUnique({ where: { email } });
  return secondsLeft(row?.lockedUntil ?? null, now);
}

/** Records a failed login and returns the new state. */
export async function recordFailure(email: string, now = new Date()): Promise<{ failures: number; lockSeconds: number }> {
  const previous = await prisma.loginThrottle.findUnique({ where: { email } });
  const next = nextFailureState(previous, now);
  await prisma.loginThrottle.upsert({ where: { email }, update: next, create: { email, ...next } });
  return { failures: next.failures, lockSeconds: secondsLeft(next.lockedUntil, now) };
}

export async function clearFailures(email: string): Promise<void> {
  await prisma.loginThrottle.deleteMany({ where: { email } });
}
