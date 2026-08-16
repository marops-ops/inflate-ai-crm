import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "inflate_crm_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return secret;
}

export function expectedSessionToken() {
  return createHmac("sha256", getSecret()).update("authenticated").digest("hex");
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  const expected = expectedSessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPassword(password: string) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    throw new Error("APP_PASSWORD environment variable is not set");
  }
  return password === appPassword;
}
