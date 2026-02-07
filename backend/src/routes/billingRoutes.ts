import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { addPaymentMethod, getBillingOverview, getUsageBreakdown } from "../services/billingService";

const router = Router();

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

router.post(
  "/payment-methods",
  requireAuth,
  asyncHandler(async (req, res) => {
    const method = await addPaymentMethod(req.authUser!.id, req.body as never);
    res.status(201).json({ message: "Payment method added.", method });
  })
);

export default router;
