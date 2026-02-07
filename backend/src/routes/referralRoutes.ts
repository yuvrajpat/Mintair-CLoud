import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { getReferralDashboard } from "../services/referralService";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await getReferralDashboard(req.authUser!.id);
    res.json(data);
  })
);

export default router;
