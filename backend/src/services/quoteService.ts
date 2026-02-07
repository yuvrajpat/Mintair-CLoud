import { QuoteStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";

export async function listQuotes(userId: string) {
  return prisma.quoteRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function createQuote(
  userId: string,
  input: {
    gpuType: string;
    quantity: number;
    durationHours: number;
    region: string;
    notes?: string;
  }
) {
  if (!input.gpuType || !input.quantity || !input.durationHours || !input.region) {
    throw new AppError("All quote fields except notes are required.", 400);
  }

  if (input.quantity < 1 || input.durationHours < 1) {
    throw new AppError("Quantity and duration must be positive numbers.", 400);
  }

  return prisma.quoteRequest.create({
    data: {
      userId,
      gpuType: input.gpuType,
      quantity: input.quantity,
      durationHours: input.durationHours,
      region: input.region,
      notes: input.notes
    }
  });
}

export async function updateQuoteStatus(
  userId: string,
  quoteId: string,
  input: { status: QuoteStatus; reviewNotes?: string }
) {
  const quote = await prisma.quoteRequest.findFirst({ where: { id: quoteId, userId } });
  if (!quote) {
    throw new AppError("Quote request not found.", 404);
  }

  return prisma.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes
    }
  });
}
