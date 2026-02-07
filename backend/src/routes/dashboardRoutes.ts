import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { getDashboardOverview } from "../services/dashboardService";

const router = Router();

router.get(
  "/overview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await getDashboardOverview(req.authUser!.id);
    res.json(data);
  })
);

export default router;
