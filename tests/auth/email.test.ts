import { afterEach, describe, expect, it, vi } from "vitest";
import { brevoSender, parseSender } from "@/lib/auth/email";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseSender", () => {
  it("accepts 'Name <email>' and bare emails", () => {
    expect(parseSender("CAi <cai@gmail.com>")).toEqual({ name: "CAi", email: "cai@gmail.com" });
    expect(parseSender(' "Centro CAi" <cai@uc.cl> ')).toEqual({ name: "Centro CAi", email: "cai@uc.cl" });
    expect(parseSender("cai@gmail.com")).toEqual({ email: "cai@gmail.com" });
  });

  it("rejects values without an email", () => {
    expect(parseSender("CAi")).toBeNull();
    expect(parseSender("CAi <no-email>")).toBeNull();
    expect(parseSender("")).toBeNull();
  });
});

describe("brevoSender", () => {
  it("posts the code to Brevo's transactional email API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await brevoSender("xkeysib-test", { name: "CAi", email: "cai@gmail.com" }).sendVerificationCode("ana@uc.cl", "012345");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init.headers as Record<string, string>)["api-key"]).toBe("xkeysib-test");
    const body = JSON.parse(init.body as string);
    expect(body.sender).toEqual({ name: "CAi", email: "cai@gmail.com" });
    expect(body.to).toEqual([{ email: "ana@uc.cl" }]);
    expect(body.subject).toContain("012345");
    expect(body.textContent).toContain("012345");
  });

  it("throws a 502 without leaking the key when Brevo rejects the request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "unauthorized", message: "Key not found" }), { status: 401 })),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      brevoSender("xkeysib-secret", { email: "cai@gmail.com" }).sendVerificationCode("ana@uc.cl", "012345"),
    ).rejects.toMatchObject({ status: 502 });
    expect(JSON.stringify(log.mock.calls)).not.toContain("xkeysib-secret");
  });
});
