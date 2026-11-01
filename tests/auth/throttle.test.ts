import { describe, expect, it } from "vitest";
import { MAX_LOCK_MS, RESET_AFTER_MS, lockDurationMs, nextFailureState, secondsLeft } from "@/lib/auth/throttle";

const NOW = new Date("2026-10-31T12:00:00Z");

describe("login throttle", () => {
  it("allows 3 failures, then locks progressively up to the cap", () => {
    expect([1, 2].map(lockDurationMs)).toEqual([0, 0]);
    expect([3, 4, 5, 6].map(lockDurationMs)).toEqual([30_000, 60_000, 120_000, 240_000]);
    expect(lockDurationMs(50)).toBe(MAX_LOCK_MS);
  });

  it("counts consecutive failures and sets the lock on the third", () => {
    let state = nextFailureState(null, NOW);
    expect(state).toEqual({ failures: 1, lockedUntil: null });
    state = nextFailureState({ ...state, updatedAt: NOW }, NOW);
    expect(state.lockedUntil).toBeNull();
    state = nextFailureState({ ...state, updatedAt: NOW }, NOW);
    expect(state.failures).toBe(3);
    expect(secondsLeft(state.lockedUntil, NOW)).toBe(30);
  });

  it("forgets failures older than a day", () => {
    const old = new Date(NOW.getTime() - RESET_AFTER_MS - 1);
    expect(nextFailureState({ failures: 9, lockedUntil: null, updatedAt: old }, NOW).failures).toBe(1);
  });
});
