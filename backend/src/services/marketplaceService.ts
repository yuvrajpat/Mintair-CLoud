import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";

export type MarketplaceQuery = {
  gpuType?: string;
  region?: string;
  provider?: string;
  minVram?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "availability_desc";
};

function mapItem(item: {
  id: string;
  slug: string;
  name: string;
  gpuType: string;
  provider: string;
  vramGb: number;
  cpuCores: number;
  memoryGb: number;
  storageGb: number;
  pricePerHour: Prisma.Decimal;
  region: string;
  availability: number;
  specs: Prisma.JsonValue | null;
}) {
  return {
    ...item,
    pricePerHour: Number(item.pricePerHour)
  };
}

export async function listMarketplaceItems(query: MarketplaceQuery) {
  const where: Prisma.MarketplaceItemWhereInput = {
    ...(query.gpuType ? { gpuType: { contains: query.gpuType, mode: "insensitive" } } : {}),
    ...(query.region ? { region: query.region } : {}),
    ...(query.provider ? { provider: { contains: query.provider, mode: "insensitive" } } : {}),
    ...(query.minVram ? { vramGb: { gte: query.minVram } } : {}),
    ...(query.maxPrice ? { pricePerHour: { lte: new Prisma.Decimal(query.maxPrice.toFixed(4)) } } : {})
  };

  const orderBy: Prisma.MarketplaceItemOrderByWithRelationInput =
    query.sort === "price_desc"
      ? { pricePerHour: "desc" }
      : query.sort === "availability_desc"
        ? { availability: "desc" }
        : { pricePerHour: "asc" };

  const [items, aggregates] = await Promise.all([
    prisma.marketplaceItem.findMany({ where, orderBy }),
    prisma.marketplaceItem.groupBy({
      by: ["gpuType", "region", "provider"],
      _count: {
        _all: true
      }
    })
  ]);

  return {
    items: items.map(mapItem),
    filters: {
      gpuTypes: [...new Set(aggregates.map((entry) => entry.gpuType))],
      regions: [...new Set(aggregates.map((entry) => entry.region))],
      providers: [...new Set(aggregates.map((entry) => entry.provider))]
    }
  };
}

export async function getMarketplaceItemByIdOrSlug(idOrSlug: string) {
  const item = await prisma.marketplaceItem.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }]
    }
  });

  if (!item) {
    throw new AppError("Marketplace item not found.", 404);
  }

  return mapItem(item);
}

export async function estimateMarketplaceCost(input: {
  itemId: string;
  hours: number;
  quantity: number;
  storageGb?: number;
}) {
  if (input.hours <= 0 || input.quantity <= 0) {
    throw new AppError("Hours and quantity must be positive values.", 400);
  }

  const item = await prisma.marketplaceItem.findUnique({ where: { id: input.itemId } });
  if (!item) {
    throw new AppError("Marketplace item not found.", 404);
  }

  const compute = Number(item.pricePerHour) * input.hours * input.quantity;
  const storage = (input.storageGb ?? item.storageGb) * 0.0007 * input.hours;
  const subtotal = compute + storage;
  const tax = subtotal * 0.08;

  return {
    item: mapItem(item),
    breakdown: {
      compute: Number(compute.toFixed(2)),
      storage: Number(storage.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number((subtotal + tax).toFixed(2))
    }
  };
}
