"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../lib/api";
import { DocsMarkdown } from "../../../components/docs-markdown";

type DocListItem = {
  slug: string;
  title: string;
  category: string;
};

type DocPage = {
  slug: string;
  title: string;
  category: string;
  content: string;
};

export default function DocsPage() {
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const docsQuery = useQuery({
    queryKey: ["docs"],
    queryFn: () => api.docs.list() as Promise<{ docs: DocListItem[] }>,
    retry: 1
  });

  const searchQuery = useQuery({
    queryKey: ["docs-search", search],
    queryFn: () => api.docs.search(search) as Promise<{ docs: DocPage[] }>,
    enabled: Boolean(search.trim())
  });

  const detailQuery = useQuery({
    queryKey: ["doc", activeSlug],
    queryFn: () => api.docs.get(activeSlug!) as Promise<{ doc: DocPage }>,
    enabled: Boolean(activeSlug)
  });

  const list = useMemo(() => {
    if (search.trim()) {
      return (searchQuery.data?.docs ?? []).map((doc) => ({ slug: doc.slug, title: doc.title, category: doc.category }));
    }
    return docsQuery.data?.docs ?? [];
  }, [docsQuery.data?.docs, search, searchQuery.data?.docs]);

  useEffect(() => {
    if (!list.length) {
      setActiveSlug(null);
      return;
    }

    if (!activeSlug || !list.some((item) => item.slug === activeSlug)) {
      setActiveSlug(list[0].slug);
    }
  }, [activeSlug, list]);

  if (docsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
        <Card className="h-fit border-ink-300">
          <Skeleton className="h-10 w-full" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </Card>
        <Card className="border-ink-300">
          <Skeleton className="h-72 w-full" />
        </Card>
      </div>
    );
  }

  if (docsQuery.isError) {
    return (
      <Card className="border-ink-300">
        <EmptyState
          title="Docs are temporarily unavailable"
          description="We could not load documentation right now. Refresh and try again."
          icon={AlertTriangle}
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
      <Card className="h-fit border-ink-300">
        <Input placeholder="Search docs" value={search} onChange={(event) => setSearch(event.target.value)} />

        <div className="mt-3 space-y-1">
          {list.map((doc) => (
            <button
              type="button"
              key={doc.slug}
              onClick={() => setActiveSlug(doc.slug)}
              className={`w-full border px-3 py-2 text-left text-sm transition ${
                activeSlug === doc.slug
                  ? "border-brand-charcoal bg-brand-charcoal text-white"
                  : "border-transparent text-ink-600 hover:border-ink-200 hover:bg-ink-50"
              }`}
            >
              <p className="font-semibold">{doc.title}</p>
              <p className="text-xs text-ink-400">{doc.category}</p>
            </button>
          ))}

          {!list.length ? (
            <div className="border border-dashed border-ink-300 px-3 py-4">
              <p className="text-sm text-ink-500">No docs match your search.</p>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="border-ink-300">
        {!activeSlug ? (
          <EmptyState title="No document selected" description="Pick a page from the left panel." icon={FileSearch} />
        ) : detailQuery.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : detailQuery.isError || !detailQuery.data?.doc ? (
          <div className="space-y-3">
            <EmptyState title="Doc page missing" description="Select another page from the sidebar." />
            <Button variant="secondary" onClick={() => detailQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <p className="eyebrow text-brand-blue">{detailQuery.data.doc.category}</p>
            <h2 className="mt-2 text-[2rem] leading-tight text-ink-900">{detailQuery.data.doc.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{detailQuery.data.doc.category}</p>
            <div className="mt-4">
              <DocsMarkdown content={detailQuery.data.doc.content} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
