"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export function Modal({ open, title, description, onClose, children, actions }: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
      return;
    }

    if (!mounted) {
      return;
    }

    setExiting(true);
    const timeout = setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, 180);

    return () => clearTimeout(timeout);
  }, [mounted, open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mounted, onClose]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        exiting ? "modal-backdrop-exit" : "modal-backdrop-enter"
      } bg-ink-900/20 backdrop-blur-[3px]`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`surface-card w-full max-w-lg rounded-none border-ink-300 p-6 ${
          exiting ? "modal-panel-exit" : "modal-panel-enter"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
            {description ? <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p> : null}
          </div>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {children ? <div className="mt-5">{children}</div> : null}

        {actions ? <div className="mt-6 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
