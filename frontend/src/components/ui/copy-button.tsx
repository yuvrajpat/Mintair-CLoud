"use client";

import { Copy, CopyCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "./button";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy this value.");
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={onCopy} className="gap-1.5">
      {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : label}
    </Button>
  );
}
