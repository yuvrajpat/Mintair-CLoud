"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { CopyButton } from "../../../components/ui/copy-button";
import { Input } from "../../../components/ui/input";
import { api } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: api.auth.forgotPassword,
    onSuccess: (data) => {
      setTokenPreview(data.resetTokenPreview ?? null);
      toast.success(data.message);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to request reset.";
      toast.error(message);
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email });
  };

  return (
    <Card className="mx-auto max-w-md border-brand-gray">
      <p className="eyebrow text-brand-blue">Security</p>
      <h2 className="mt-1 text-xl text-ink-900">Forgot password</h2>
      <p className="mt-1 text-sm text-ink-500">Enter your email and we will send password reset instructions.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Send reset instructions
        </Button>
      </form>

      {tokenPreview ? (
        <div className="mt-4 border border-brand-gray bg-brand-white p-3 text-sm">
          <p className="font-medium text-ink-800">Development reset token</p>
          <p className="mt-1 break-all text-ink-600">{tokenPreview}</p>
          <div className="mt-2">
            <CopyButton value={tokenPreview} />
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-sm text-ink-500">
        Back to{" "}
        <Link className="text-brand-blue hover:underline" href="/login">
          Login
        </Link>
      </div>
    </Card>
  );
}
