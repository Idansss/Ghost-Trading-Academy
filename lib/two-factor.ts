import crypto from "crypto";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { env } from "@/lib/env";

const algorithm = "aes-256-gcm";
const key = crypto.createHash("sha256").update(env.nextAuthSecret).digest();

export function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [ivB64, tagB64, encryptedB64] = payload.split(".");
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function generateTOTPSecret(email: string, issuer = "The Thesis Desk") {
  const secret = generateSecret();
  const otpAuthUrl = generateURI({
    issuer,
    label: email,
    secret,
    strategy: "totp",
  });
  return { secret, otpAuthUrl };
}

export async function toQrDataUrl(otpAuthUrl: string) {
  return QRCode.toDataURL(otpAuthUrl);
}

export function verifyTOTP(code: string, encryptedSecret: string) {
  const secret = decryptSecret(encryptedSecret);
  // CLAUDE FIX: epochTolerance:30 accepts codes from ±1 time step (±30 s), preventing
  // spurious rejections when the server clock and authenticator app drift slightly.
  return verifySync({ token: code, secret, epochTolerance: 30 }).valid;
}

export function verifyTOTPPlain(code: string, secret: string) {
  // CLAUDE FIX: epochTolerance:30 accepts codes from ±1 time step (±30 s).
  return verifySync({ token: code, secret, epochTolerance: 30 }).valid;
}

export function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
}

export async function hashBackupCode(code: string) {
  return bcrypt.hash(code, 12);
}

export async function matchBackupCode(code: string, codeHash: string) {
  return bcrypt.compare(code, codeHash);
}
