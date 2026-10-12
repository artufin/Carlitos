import { describe, expect, it } from "vitest";
import { signDeviceId, verifyDeviceCookie } from "@/lib/session/cookie";

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
