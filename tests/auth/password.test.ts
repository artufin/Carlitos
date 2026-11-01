import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { registerInputSchema, verifyInputSchema } from "@/lib/validation/auth";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
    await expect(verifyPassword("correct horse battery", "garbage")).resolves.toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });
});

describe("auth input", () => {
  it("accepts any email domain and normalizes it", () => {
    const parsed = registerInputSchema.safeParse({ name: "Ana", email: " Ana@Gmail.COM ", password: "12345678" });
    expect(parsed.success && parsed.data.email).toBe("ana@gmail.com");
    expect(registerInputSchema.safeParse({ name: "Ana", email: "not-an-email", password: "12345678" }).success).toBe(false);
  });

  it("requires passwords of at least 8 characters", () => {
    expect(registerInputSchema.safeParse({ name: "Ana", email: "ana@uc.cl", password: "1234567" }).success).toBe(false);
    expect(registerInputSchema.safeParse({ name: "Ana", email: "ana@uc.cl", password: "12345678" }).success).toBe(true);
  });

  it("requires 6-digit codes", () => {
    expect(verifyInputSchema.safeParse({ email: "ana@uc.cl", code: "012345" }).success).toBe(true);
    expect(verifyInputSchema.safeParse({ email: "ana@uc.cl", code: "12345" }).success).toBe(false);
    expect(verifyInputSchema.safeParse({ email: "ana@uc.cl", code: "abcdef" }).success).toBe(false);
  });
});
