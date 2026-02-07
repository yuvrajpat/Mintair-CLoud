import { QuoteStatus } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { createQuote, listQuotes, updateQuoteStatus } from "../services/quoteService";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const quotes = await listQuotes(req.authUser!.id);
    res.json({ quotes });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const quote = await createQuote(req.authUser!.id, req.body as never);
    res.status(201).json({ message: "Quote request submitted.", quote });
  })
);

router.patch(
  "/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, reviewNotes } = req.body as { status: QuoteStatus; reviewNotes?: string };
    const quote = await updateQuoteStatus(req.authUser!.id, String(req.params.id), { status, reviewNotes });
    res.json({ message: "Quote status updated.", quote });
  })
);

export default router;
