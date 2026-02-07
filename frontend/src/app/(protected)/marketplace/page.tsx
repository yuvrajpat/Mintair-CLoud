"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTheme } from "../../../components/theme-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { GlowingEffect } from "../../../components/ui/glowing-effect";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import type { MarketplaceItem } from "../../../lib/types";

export default function MarketplacePage() {
  const { resolvedTheme } = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gpuType, setGpuType] = useState("");
  const [region, setRegion] = useState("");
  const [provider, setProvider] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"price_asc" | "price_desc" | "availability_desc">("price_asc");

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (gpuType) params.set("gpuType", gpuType);
    if (region) params.set("region", region);
    if (provider) params.set("provider", provider);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("sort", sort);
    return params;
  }, [gpuType, maxPrice, provider, region, sort]);

  const marketplaceQuery = useQuery({
    queryKey: ["marketplace", gpuType, region, provider, maxPrice, sort],
    queryFn: () =>
      api.marketplace.list(searchParams) as Promise<{
        items: MarketplaceItem[];
        filters: {
          gpuTypes: string[];
          regions: string[];
          providers: string[];
        };
      }>
  });

  const activeFilters = [
    gpuType ? { key: "gpu", label: `GPU: ${gpuType}` } : null,
    region ? { key: "region", label: `Region: ${region}` } : null,
    provider ? { key: "provider", label: `Provider: ${provider}` } : null,
    maxPrice ? { key: "price", label: `Max: $${maxPrice}/hr` } : null
  ].filter((value): value is { key: string; label: string } => Boolean(value));

  const clearFilter = (key: string) => {
    if (key === "gpu") setGpuType("");
    if (key === "region") setRegion("");
    if (key === "provider") setProvider("");
    if (key === "price") setMaxPrice("");
  };

  return (
    <div className="space-y-4">
      <Card className="relative border-brand-gray">
        <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-brand-blue">Marketplace</p>
            <h2 className="mt-1 text-lg text-ink-900">GPU marketplace</h2>
            <p className="mt-1 text-sm text-ink-500">Premium compute profiles with transparent pricing and instant deployment.</p>
          </div>
          <Button variant="secondary" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal className="h-4 w-4" /> {filtersOpen ? "Hide filters" : "Show filters"}
          </Button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-[260ms] ${
            filtersOpen ? "mt-4 max-h-[420px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 gap-3 border border-brand-gray bg-brand-white p-3 md:grid-cols-2 xl:grid-cols-5">
            <Input placeholder="GPU type" value={gpuType} onChange={(event) => setGpuType(event.target.value)} />
            <Select value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">All regions</option>
              {(marketplaceQuery.data?.filters.regions ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select value={provider} onChange={(event) => setProvider(event.target.value)}>
              <option value="">All providers</option>
              {(marketplaceQuery.data?.filters.providers ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Input placeholder="Max price/hour" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
            <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
              <option value="availability_desc">Availability</option>
            </Select>
          </div>
        </div>

        {activeFilters.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 border border-brand-gray bg-brand-white px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.08em] text-ink-500">
              <Filter className="h-3.5 w-3.5" /> Active filters
            </span>
            {activeFilters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearFilter(chip.key)}
                className="inline-flex items-center gap-1 border border-brand-gray bg-brand-white px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.08em] text-ink-700 transition hover:border-brand-charcoal"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      {marketplaceQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full" />
          ))}
        </div>
      ) : marketplaceQuery.isError ? (
        <EmptyState title="Marketplace is temporarily unavailable" description="Try refreshing. Your saved filters are preserved." />
      ) : marketplaceQuery.data?.items.length ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {marketplaceQuery.data.items.map((item) => (
            <Card key={item.id} className="group relative flex flex-col justify-between overflow-hidden border-brand-gray p-0">
              {resolvedTheme === "dark" ? (
                <GlowingEffect spread={30} glow={false} disabled={false} proximity={48} inactiveZone={0.25} borderWidth={1.2} />
              ) : null}
              <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg text-ink-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-ink-500">
                      {item.gpuType} • {item.provider}
                    </p>
                  </div>
                  <p className="border border-brand-gray bg-brand-white px-3 py-1 font-mono text-[13px] uppercase tracking-[0.08em] text-ink-900">
                    {formatCurrency(item.pricePerHour)}/hr
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink-600">
                  <p>VRAM: {item.vramGb} GB</p>
                  <p>CPU: {item.cpuCores} cores</p>
                  <p>Memory: {item.memoryGb} GB</p>
                  <p>Storage: {item.storageGb} GB</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-brand-gray bg-brand-white px-5 py-3">
                <span className="text-sm text-ink-500">{item.region} • {item.availability} available</span>

                <div className="flex gap-2 opacity-100 transition-all duration-160 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                  <Link href={`/marketplace/${item.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                  <Link href={`/marketplace/${item.id}?deploy=1`}>
                    <Button size="sm">Deploy</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No marketplace matches" description="Adjust your filters to discover available compute profiles." />
      )}
    </div>
  );
}
