import crypto from "crypto";
import { BillingType, CreditTopUpStatus, Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";

type CopperxCheckoutResponse = {
  id?: string;
  url?: string;
  data?: {
    id?: string;
    url?: string;
    hostedUrl?: string;
  };
  error?:
    | {
        message?: string;
      }
    | string;
  message?: string;
};

type CopperxWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    id?: string;
    checkoutSessionId?: string;
    sessionId?: string;
  };
};

function toAmount(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function getCheckoutRedirectSuccessUrl(): string {
  if (env.COPPERX_CHECKOUT_SUCCESS_URL) {
    return env.COPPERX_CHECKOUT_SUCCESS_URL;
  }

  return new URL("/billing?topup=success", env.APP_BASE_URL).toString();
}

function getCheckoutRedirectCancelUrl(): string {
  if (env.COPPERX_CHECKOUT_CANCEL_URL) {
    return env.COPPERX_CHECKOUT_CANCEL_URL;
  }

  return new URL("/billing?topup=cancelled", env.APP_BASE_URL).toString();
}

function amountUsdToUsdcAtomic(amountUsd: number): string {
  return String(Math.round(amountUsd * 100_000_000));
}

function readCopperxErrorMessage(payload: CopperxCheckoutResponse | null): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (payload.error && typeof payload.error === "object" && typeof payload.error.message === "string") {
    const message = payload.error.message.trim();
    if (message) {
      return message;
    }
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return null;
}

function extractFirstString(payload: unknown, candidates: string[][]): string | null {
  for (const path of candidates) {
    let value: unknown = payload;
    for (const part of path) {
      if (!value || typeof value !== "object") {
        value = undefined;
        break;
      }

      value = (value as Record<string, unknown>)[part];
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function normalizeSignature(headerValue: string): string {
  const trimmed = headerValue.trim();
  if (!trimmed.includes("=")) {
    return trimmed;
  }

  return trimmed.split("=").pop()?.trim() ?? "";
}

function verifyWebhookSignature(payload: string, signatureHeader: string | undefined): void {
  if (!env.COPPERX_WEBHOOK_SECRET) {
    if (env.NODE_ENV === "production") {
      throw new AppError("CopperX webhook secret is missing.", 500);
    }

    return;
  }

  if (!signatureHeader) {
    throw new AppError("Missing webhook signature header.", 401);
  }

  const incoming = normalizeSignature(signatureHeader);
  const expected = crypto.createHmac("sha256", env.COPPERX_WEBHOOK_SECRET).update(payload).digest("hex");

  const incomingBuffer = Buffer.from(incoming, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (incomingBuffer.length !== expectedBuffer.length) {
    throw new AppError("Invalid webhook signature.", 401);
  }

  if (!crypto.timingSafeEqual(incomingBuffer, expectedBuffer)) {
    throw new AppError("Invalid webhook signature.", 401);
  }
}

function mapFailureStatus(eventType: string): CreditTopUpStatus | null {
  const normalized = eventType.toLowerCase();

  if (normalized.includes("expired")) {
    return CreditTopUpStatus.EXPIRED;
  }

  if (normalized.includes("canceled") || normalized.includes("cancelled")) {
    return CreditTopUpStatus.CANCELED;
  }

  if (normalized.includes("failed")) {
    return CreditTopUpStatus.FAILED;
  }

  return null;
}

function isSuccessEvent(eventType: string): boolean {
  const normalized = eventType.toLowerCase();
  return normalized.includes("paid") || normalized.includes("completed");
}

export async function getCreditsSummary(userId: string) {
  const [user, recentTopUps] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    }),
    prisma.creditTopUp.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        amountUsd: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  return {
    balance: Number(toAmount(user?.creditBalance).toFixed(2)),
    recentTopUps: recentTopUps.map((entry) => ({
      id: entry.id,
      amountUsd: Number(entry.amountUsd),
      status: entry.status,
      createdAt: entry.createdAt
    }))
  };
}

export async function createCopperxCheckoutSession(userId: string, amountUsdInput: number) {
  if (!env.COPPERX_API_KEY) {
    throw new AppError("CopperX API key is missing on the server.", 500);
  }

  const amountUsd = Number(amountUsdInput);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new AppError("Amount must be greater than 0.", 400);
  }

  if (amountUsd < 1 || amountUsd > 50000) {
    throw new AppError("Amount must be between 1 and 50,000 USD.", 400);
  }

  const response = await fetch(`${env.COPPERX_API_BASE_URL}/api/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.COPPERX_API_KEY}`,
      "x-api-key": env.COPPERX_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode: "payment",
      submitType: "pay",
      lineItems: {
        data: [
          {
            priceData: {
              currency: "usdc",
              productData: {
                name: "Mintair Credits"
              },
              unitAmount: amountUsdToUsdcAtomic(amountUsd)
            },
            quantity: 1
          }
        ]
      },
      successUrl: getCheckoutRedirectSuccessUrl(),
      cancelUrl: getCheckoutRedirectCancelUrl(),
      ...(env.COPPERX_ALLOW_FIAT ? { paymentSetting: { allowFiatPayment: true } } : {}),
      metadata: {
        userId,
        topUpAmountUsd: amountUsd.toFixed(2)
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as CopperxCheckoutResponse | null;

  if (!response.ok || !payload) {
    const upstreamMessage = readCopperxErrorMessage(payload);
    if (response.status === 401 || response.status === 403) {
      throw new AppError(
        `CopperX authentication failed (${response.status}). Check COPPERX_API_KEY in backend env (must be the full unmasked secret key).${upstreamMessage ? ` Upstream: ${upstreamMessage}` : ""}`,
        502
      );
    }

    const message = upstreamMessage ?? "Failed to create CopperX checkout session.";
    throw new AppError(message, 502);
  }

  const providerSessionId = extractFirstString(payload, [["id"], ["data", "id"]]);
  const checkoutUrl = extractFirstString(payload, [["url"], ["data", "url"], ["data", "hostedUrl"]]);

  if (!providerSessionId || !checkoutUrl) {
    throw new AppError("CopperX checkout response is missing required fields.", 502);
  }

  const topUp = await prisma.creditTopUp.create({
    data: {
      userId,
      amountUsd: new Prisma.Decimal(amountUsd.toFixed(2)),
      provider: "COPPERX",
      providerSessionId,
      checkoutUrl,
      status: CreditTopUpStatus.PENDING,
      metadata: payload as unknown as Prisma.JsonObject
    }
  });

  return {
    topUpId: topUp.id,
    checkoutUrl
  };
}

export async function handleCopperxWebhook(payload: string, signatureHeader: string | undefined) {
  verifyWebhookSignature(payload, signatureHeader);

  let event: CopperxWebhookEvent;
  try {
    event = JSON.parse(payload) as CopperxWebhookEvent;
  } catch {
    throw new AppError("Invalid webhook payload.", 400);
  }

  const eventId = typeof event.id === "string" ? event.id.trim() : "";
  const eventType = typeof event.type === "string" ? event.type.trim() : "";

  if (!eventId || !eventType) {
    throw new AppError("Webhook payload is missing id or type.", 400);
  }

  const existingEvent = await prisma.webhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider: "COPPERX",
        eventId
      }
    },
    select: { id: true }
  });

  if (existingEvent) {
    return { processed: true, duplicate: true };
  }

  const providerSessionId = extractFirstString(event, [
    ["data", "checkoutSessionId"],
    ["data", "sessionId"],
    ["data", "id"]
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.create({
      data: {
        provider: "COPPERX",
        eventId,
        eventType,
        payload: event as unknown as Prisma.JsonObject
      }
    });

    if (!providerSessionId) {
      return;
    }

    const topUp = await tx.creditTopUp.findUnique({
      where: { providerSessionId },
      include: {
        user: {
          select: {
            id: true,
            creditBalance: true
          }
        }
      }
    });

    if (!topUp) {
      return;
    }

    if (isSuccessEvent(eventType) && topUp.status !== CreditTopUpStatus.COMPLETED) {
      const nextBalance = Number(topUp.user.creditBalance) + Number(topUp.amountUsd);

      await tx.user.update({
        where: { id: topUp.userId },
        data: {
          creditBalance: new Prisma.Decimal(nextBalance.toFixed(2))
        }
      });

      await tx.creditTopUp.update({
        where: { id: topUp.id },
        data: {
          status: CreditTopUpStatus.COMPLETED,
          completedAt: new Date()
        }
      });

      await tx.billingRecord.create({
        data: {
          userId: topUp.userId,
          type: BillingType.CREDIT,
          description: "CopperX credit top-up",
          amount: topUp.amountUsd,
          currency: "USD",
          balanceAfter: new Prisma.Decimal(nextBalance.toFixed(2)),
          metadata: {
            provider: "COPPERX",
            providerSessionId
          }
        }
      });

      return;
    }

    const failedStatus = mapFailureStatus(eventType);
    if (failedStatus && topUp.status === CreditTopUpStatus.PENDING) {
      await tx.creditTopUp.update({
        where: { id: topUp.id },
        data: { status: failedStatus }
      });
    }
  });

  return { processed: true, duplicate: false };
}
