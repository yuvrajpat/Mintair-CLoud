import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { completeOnboarding, getOnboardingState } from "../services/onboardingService";

const router = Router();

router.get(
  "/state",
  requireAuth,
  asyncHandler(async (req, res) => {
    const state = await getOnboardingState(req.authUser!.id);
    res.json({ state });
  })
);

router.post(
  "/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userType, useCase, region } = req.body as {
      userType: string;
      useCase: string;
      region: string;
    };

    const result = await completeOnboarding(req.authUser!.id, { userType, useCase, region });
    res.json({ message: "Onboarding completed.", state: result });
  })
);

export default router;
