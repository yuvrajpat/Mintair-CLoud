import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { addPaymentMethod, getBillingOverview, getUsageBreakdown } from "../services/billingService";
import { createCopperxCheckoutSession, getCreditsSummary, handleCopperxWebhook } from "../services/creditsService";

const router = Router();

router.post(
  "/webhooks/copperx",
  asyncHandler(async (req, res) => {
    const signatureHeader = req.get("x-webhook-signature") ?? undefined;
    const payload = req.rawBody ?? JSON.stringify(req.body ?? {});
    const result = await handleCopperxWebhook(payload, signatureHeader);
    res.json({ ok: true, ...result });
  })
);

router.get(
  "/overview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await getBillingOverview(req.authUser!.id);
    res.json(data);
  })
);

router.get(
  "/usage",
  requireAuth,
  asyncHandler(async (req, res) => {
    const groupBy = (req.query.groupBy as "instance" | "gpu" | "region" | undefined) ?? "instance";
    const usage = await getUsageBreakdown(req.authUser!.id, groupBy);
    res.json({ usage, groupBy });
  })
);

router.get(
  "/credits",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await getCreditsSummary(req.authUser!.id);
    res.json(data);
  })
);

router.post(
  "/credits/checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { amountUsd } = req.body as { amountUsd: number };
    const result = await createCopperxCheckoutSession(req.authUser!.id, amountUsd);
    res.status(201).json(result);
  })
);

router.post(
  "/payment-methods",
  requireAuth,
  asyncHandler(async (req, res) => {
    const method = await addPaymentMethod(req.authUser!.id, req.body as never);
    res.status(201).json({ message: "Payment method added.", method });
  })
);

export default router;
