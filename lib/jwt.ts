import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.nextAuthSecret);

export async function signShortLivedJwt(payload: Record<string, unknown>, expiresIn = "5m") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyShortLivedJwt<T = Record<string, unknown>>(token: string) {
  const result = await jwtVerify(token, secret);
  return result.payload as T;
}
