import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  deployInstance,
  getInstanceDetail,
  getInstanceLogs,
  getInstanceMetrics,
  listInstances,
  restartInstance,
  startInstance,
  stopInstance,
  terminateInstance
} from "../services/instanceService";

const router = Router();

router.post(
  "/deploy",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { marketplaceItemId, name, region, image, sshKeyId } = req.body as {
      marketplaceItemId: string;
      name: string;
      region: string;
      image: string;
      sshKeyId?: string;
    };

    const instance = await deployInstance(req.authUser!.id, {
      marketplaceItemId,
      name,
      region,
      image,
      sshKeyId
    });

    res.status(201).json({
      message: "Deployment started.",
      instance
    });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const instances = await listInstances(req.authUser!.id);
    res.json({ instances });
  })
);

router.get(
  "/:id/metrics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const metrics = await getInstanceMetrics(req.authUser!.id, String(req.params.id));
    res.json(metrics);
  })
);

router.get(
  "/:id/logs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const logs = await getInstanceLogs(req.authUser!.id, String(req.params.id));
    res.json({ logs });
  })
);

router.post(
  "/:id/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    const instance = await startInstance(req.authUser!.id, String(req.params.id));
    res.json({ message: "Instance started.", instance });
  })
);

router.post(
  "/:id/stop",
  requireAuth,
  asyncHandler(async (req, res) => {
    const instance = await stopInstance(req.authUser!.id, String(req.params.id));
    res.json({ message: "Instance stopped.", instance });
  })
);

router.post(
  "/:id/restart",
  requireAuth,
  asyncHandler(async (req, res) => {
    const instance = await restartInstance(req.authUser!.id, String(req.params.id));
    res.json({ message: "Instance restarting.", instance });
  })
);

router.post(
  "/:id/terminate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const instance = await terminateInstance(req.authUser!.id, String(req.params.id));
    res.json({ message: "Instance terminated.", instance });
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const instance = await getInstanceDetail(req.authUser!.id, String(req.params.id));
    res.json({ instance });
  })
);

export default router;
