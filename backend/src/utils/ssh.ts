import crypto from "crypto";
import { AppError } from "./appError";

const SSH_KEY_PATTERN = /^(ssh-(rsa|ed25519)|ecdsa-sha2-nistp(256|384|521))\s+[A-Za-z0-9+/=]+(?:\s+.+)?$/;

export function validateSshPublicKey(publicKey: string): void {
  if (!SSH_KEY_PATTERN.test(publicKey.trim())) {
    throw new AppError("Invalid SSH public key format.", 400);
  }
}

export function fingerprintPublicKey(publicKey: string): string {
  const key = publicKey.trim().split(/\s+/)[1] ?? "";
  const digest = crypto.createHash("sha256").update(Buffer.from(key, "base64")).digest("base64");
  return `SHA256:${digest.replace(/=+$/, "")}`;
}
