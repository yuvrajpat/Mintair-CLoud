"use client";

import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./ui/copy-button";

export function DocsMarkdown({ content }: { content: string }) {
  const codeBlocks = useMemo(() => {
    const matches = [...content.matchAll(/```[\w-]*\n([\s\S]*?)```/g)];
    return matches.map((match) => match[1] ?? "");
  }, [content]);

  const readCodeText = (children: ReactNode): string => {
    if (!Array.isArray(children) || !children[0]) {
      return "";
    }

    const first = children[0] as ReactElement<{ children?: ReactNode }> | string;
    if (typeof first === "string") {
      return first;
    }

    const nested = first.props?.children;
    if (typeof nested === "string") {
      return nested;
    }

    if (Array.isArray(nested)) {
      return nested.join("");
    }

    return "";
  };

  return (
    <div className="doc-markdown space-y-4 text-sm text-ink-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }: ComponentPropsWithoutRef<"pre">) {
            const extracted = readCodeText(children);
            const blockIndex = codeBlocks.findIndex((code) => extracted.trim().includes(code.trim()));
            const codeValue = blockIndex >= 0 ? codeBlocks[blockIndex] : extracted;

            return (
              <div className="relative">
                <div className="absolute right-2 top-2">
                  <CopyButton value={codeValue} label="Copy" />
                </div>
                <pre>{children}</pre>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
