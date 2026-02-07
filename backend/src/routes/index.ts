import { Router } from "express";
import authRoutes from "./authRoutes";
import billingRoutes from "./billingRoutes";
import dashboardRoutes from "./dashboardRoutes";
import docsRoutes from "./docsRoutes";
import instanceRoutes from "./instanceRoutes";
import marketplaceRoutes from "./marketplaceRoutes";
import onboardingRoutes from "./onboardingRoutes";
import quoteRoutes from "./quoteRoutes";
import referralRoutes from "./referralRoutes";
import settingsRoutes from "./settingsRoutes";
import sshKeyRoutes from "./sshKeyRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "mintair-backend" });
});

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/marketplace", marketplaceRoutes);
router.use("/instances", instanceRoutes);
router.use("/ssh-keys", sshKeyRoutes);
router.use("/billing", billingRoutes);
router.use("/referrals", referralRoutes);
router.use("/quotes", quoteRoutes);
router.use("/settings", settingsRoutes);
router.use("/docs", docsRoutes);

export default router;
