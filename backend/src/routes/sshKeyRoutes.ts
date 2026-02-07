import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { addSshKey, deleteSshKey, listSshKeys, renameSshKey } from "../services/sshKeyService";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const keys = await listSshKeys(req.authUser!.id);
    res.json({ keys });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, publicKey } = req.body as { name: string; publicKey: string };
    const key = await addSshKey(req.authUser!.id, { name, publicKey });
    res.status(201).json({ message: "SSH key added.", key });
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name: string };
    const key = await renameSshKey(req.authUser!.id, String(req.params.id), name);
    res.json({ message: "SSH key renamed.", key });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteSshKey(req.authUser!.id, String(req.params.id));
    res.json({ message: "SSH key deleted." });
  })
);

export default router;
