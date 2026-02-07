import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import router from "./routes";

export const app = express();

function normalizeOrigin(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

function buildAllowedOrigins(primary: string): Set<string> {
  const allowed = new Set<string>([normalizeOrigin(primary)]);

  try {
    const parsed = new URL(primary);
    const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (!isLocalHost || env.NODE_ENV !== "development") {
      return allowed;
    }

    for (const port of [3000, 3001]) {
      const localhost = new URL(primary);
      localhost.hostname = "localhost";
      localhost.port = String(port);
      allowed.add(normalizeOrigin(localhost.toString()));

      const loopback = new URL(primary);
      loopback.hostname = "127.0.0.1";
      loopback.port = String(port);
      allowed.add(normalizeOrigin(loopback.toString()));
    }
  } catch {
    return allowed;
  }

  return allowed;
}

const allowedOrigins = buildAllowedOrigins(env.CORS_ORIGIN);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      (req as { rawBody?: string }).rawBody = buffer.toString("utf8");
    }
  })
);
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);
