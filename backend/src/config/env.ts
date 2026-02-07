import fs from "fs";
import path from "path";
import { z } from "zod";

function loadEnvFromFile(): void {
  const candidates = [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "..", ".env")];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        continue;
      }

      const key = match[1];
      let value = match[2] ?? "";
      if (value.startsWith("\"") && value.endsWith("\"")) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    return;
  }
}

loadEnvFromFile();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().default("mintair_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  EMAIL_FROM: z.string().default("no-reply@mintair.cloud"),
  DEV_EMAIL_PREVIEW: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  REFERRAL_REWARD_USD: z.coerce.number().positive().default(25),
  DEFAULT_CREDIT_USD: z.coerce.number().nonnegative().default(100)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
