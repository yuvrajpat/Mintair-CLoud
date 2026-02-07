import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { getDoc, listDocs, searchDocs } from "../services/docsService";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ docs: listDocs() });
  })
);

router.get(
  "/search",
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = (req.query.q as string | undefined) ?? "";
    res.json({ docs: searchDocs(query) });
  })
);

router.get(
  "/:slug",
  requireAuth,
  asyncHandler(async (req, res) => {
    const doc = getDoc(String(req.params.slug));
    if (!doc) {
      res.status(404).json({ error: "Doc page not found." });
      return;
    }

    res.json({ doc });
  })
);

export default router;
