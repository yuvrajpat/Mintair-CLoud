import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { estimateMarketplaceCost, getMarketplaceItemByIdOrSlug, listMarketplaceItems } from "../services/marketplaceService";

const router = Router();

function parseQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const gpuType = parseQueryValue(req.query.gpuType as string | string[] | undefined);
    const region = parseQueryValue(req.query.region as string | string[] | undefined);
    const provider = parseQueryValue(req.query.provider as string | string[] | undefined);
    const minVramRaw = parseQueryValue(req.query.minVram as string | string[] | undefined);
    const maxPriceRaw = parseQueryValue(req.query.maxPrice as string | string[] | undefined);
    const sortRaw = parseQueryValue(req.query.sort as string | string[] | undefined);

    const data = await listMarketplaceItems({
      gpuType,
      region,
      provider,
      minVram: minVramRaw ? Number(minVramRaw) : undefined,
      maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
      sort: (sortRaw as "price_asc" | "price_desc" | "availability_desc" | undefined) ?? "price_asc"
    });

    res.json(data);
  })
);

router.post(
  "/:id/estimate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { hours, quantity, storageGb } = req.body as {
      hours: number;
      quantity: number;
      storageGb?: number;
    };

    const estimate = await estimateMarketplaceCost({
      itemId: String(req.params.id),
      hours,
      quantity,
      storageGb
    });

    res.json(estimate);
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await getMarketplaceItemByIdOrSlug(String(req.params.id));
    res.json({ item });
  })
);

export default router;
