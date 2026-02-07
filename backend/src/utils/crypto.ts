import crypto from "crypto";

export function createRawToken(length = 48): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `mk_${createRawToken(24)}`;
  return {
    raw,
    prefix: raw.slice(0, 10),
    hash: hashToken(raw)
  };
}
