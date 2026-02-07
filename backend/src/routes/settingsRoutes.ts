import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { changePassword } from "../services/authService";
import { createUserApiKey, getSettingsProfile, revokeUserApiKey, updateProfile } from "../services/settingsService";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const settings = await getSettingsProfile(req.authUser!.id);
    res.json(settings);
  })
);

router.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await updateProfile(req.authUser!.id, req.body as never);
    res.json({ message: "Profile updated.", profile });
  })
);

router.post(
  "/security/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await changePassword(req.authUser!.id, currentPassword, newPassword);
    res.json({ message: "Password changed." });
  })
);

router.post(
  "/api-keys",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await createUserApiKey(req.authUser!.id, req.body as never);
    res.status(201).json({
      message: "API key generated. Copy it now, it will not be shown again.",
      apiKey: result.apiKey,
      rawKey: result.rawKey
    });
  })
);

router.delete(
  "/api-keys/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeUserApiKey(req.authUser!.id, String(req.params.id));
    res.json({ message: "API key revoked." });
  })
);

export default router;
