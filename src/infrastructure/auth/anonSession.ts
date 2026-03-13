import { createHmac, timingSafeEqual } from "crypto";

import { getAnonSessionSecret } from "@/src/infrastructure/config/anonSessionEnv";

const COOKIE_NAME = "cz_anon";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const getSecret = () => getAnonSessionSecret();

const sign = (value: string) => {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ANON_SESSION_SECRET is not set.");
  }
  return createHmac("sha256", secret).update(value).digest("base64url");
};

export const getAnonCookieName = () => COOKIE_NAME;

export const buildAnonCookieValue = (userId: string, issuedAt: number) => {
  const payload = `${userId}.${issuedAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
};

export const parseAnonCookieValue = (value: string) => {
  const parts = value.split(".");
  if (parts.length < 3) return null;
  const signature = parts.pop() as string;
  const issuedAtRaw = parts.pop() as string;
  const userId = parts.join(".");
  const issuedAt = Number(issuedAtRaw);
  if (!userId || !Number.isFinite(issuedAt)) return null;
  const payload = `${userId}.${issuedAt}`;
  const expected = sign(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  if (Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) return null;
  return { userId, issuedAt };
};

export const getAnonCookieMaxAge = () => MAX_AGE_SECONDS;
