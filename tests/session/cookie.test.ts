import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_MAX_AGE,
  signDeviceId,
  signSession,
  verifyDeviceCookie,
  verifySessionCookie,
} from "@/lib/session/cookie";

const SECRET = "test-secret-0123456789abcdef";
const ID = "5f1c2b3a-1234-4abc-9def-0123456789ab";

describe("device cookie", () => {
  it("round-trips a signed device id", async () => {
    const value = await signDeviceId(ID, SECRET);
    await expect(verifyDeviceCookie(value, SECRET)).resolves.toBe(ID);
  });

  it("rejects tampered values and wrong secrets", async () => {
    const value = await signDeviceId(ID, SECRET);
    await expect(verifyDeviceCookie(value.replace(/.$/, "x"), SECRET)).resolves.toBeNull();
    await expect(verifyDeviceCookie(value, "another-secret-0123456789")).resolves.toBeNull();
    await expect(verifyDeviceCookie("not-a-uuid.sig", SECRET)).resolves.toBeNull();
    await expect(verifyDeviceCookie(undefined, SECRET)).resolves.toBeNull();
  });
});

describe("session cookie", () => {
  it("round-trips a signed user id until it expires", async () => {
    const now = Date.UTC(2026, 0, 1);
    const value = await signSession(ID, SECRET, now);
    await expect(verifySessionCookie(value, SECRET, now)).resolves.toBe(ID);
    await expect(verifySessionCookie(value, SECRET, now + SESSION_COOKIE_MAX_AGE * 1000)).resolves.toBeNull();
  });

  it("rejects tampering, wrong secrets and device cookies replayed as sessions", async () => {
    const value = await signSession(ID, SECRET);
    const [id, , sig] = value.split(".");
    await expect(verifySessionCookie(`${id}.9999999999.${sig}`, SECRET)).resolves.toBeNull();
    await expect(verifySessionCookie(value, "another-secret-0123456789")).resolves.toBeNull();
    await expect(verifySessionCookie(await signDeviceId(ID, SECRET), SECRET)).resolves.toBeNull();
    await expect(verifySessionCookie(undefined, SECRET)).resolves.toBeNull();
  });
});
