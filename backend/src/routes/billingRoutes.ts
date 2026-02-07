import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { addPaymentMethod, getBillingOverview, getUsageBreakdown } from "../services/billingService";
import {
  cancelPendingTopUp,
  createCopperxCheckoutSession,
  getCreditsSummary,
  handleCopperxWebhook,
  listCreditTopUps
} from "../services/creditsService";

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

router.get(
  "/credits/topups",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await listCreditTopUps(req.authUser!.id);
    res.json({ topUps: data });
  })
);

router.post(
  "/credits/topups/:topUpId/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawTopUpId = req.params.topUpId;
    const topUpId = Array.isArray(rawTopUpId) ? rawTopUpId[0] : rawTopUpId;
    const topUp = await cancelPendingTopUp(req.authUser!.id, topUpId);
    res.json({ message: "Pending top-up canceled.", topUp });
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
