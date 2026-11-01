// Signed anonymous device cookie. Uses Web Crypto so the same code runs in
// proxy.ts, route handlers and server components.

export const DEVICE_COOKIE = "cai_device";
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

const encoder = new TextEncoder();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64Url(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Builds the cookie value `<deviceId>.<signature>`. */
export async function signDeviceId(deviceId: string, secret: string): Promise<string> {
  return `${deviceId}.${await hmac(secret, deviceId)}`;
}

/** Returns the device id if the cookie value is well formed and its signature matches. */
export async function verifyDeviceCookie(value: string | undefined, secret: string): Promise<string | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const deviceId = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!UUID_RE.test(deviceId)) return null;
  const expected = await hmac(secret, deviceId);
  return timingSafeEqual(expected, signature) ? deviceId : null;
}

// Account session cookie: set after register/login, points at a real user.
// The signed payload is prefixed with "session:" so a device cookie can never
// be replayed as a session cookie, and it carries its own expiry.

export const SESSION_COOKIE = "cai_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // thirty days

/** Builds the cookie value `<userId>.<expiresAtSeconds>.<signature>`. */
export async function signSession(userId: string, secret: string, now = Date.now()): Promise<string> {
  const expiresAt = Math.floor(now / 1000) + SESSION_COOKIE_MAX_AGE;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${await hmac(secret, `session:${payload}`)}`;
}

/** Returns the user id if the session cookie is well formed, correctly signed and not expired. */
export async function verifySessionCookie(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  if (!UUID_RE.test(userId) || !/^\d+$/.test(expiresAt)) return null;
  if (Number(expiresAt) * 1000 <= now) return null;
  const expected = await hmac(secret, `session:${userId}.${expiresAt}`);
  return timingSafeEqual(expected, signature) ? userId : null;
}
