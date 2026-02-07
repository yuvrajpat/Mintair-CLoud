"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { api } from "../../../lib/api";

export const dynamic = "force-dynamic";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: api.auth.resetPassword,
    onSuccess: () => {
      toast.success("Password reset complete. Please login.");
      router.push("/login");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to reset password.";
      toast.error(message);
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ token, password });
  };

  return (
    <Card className="mx-auto max-w-md border-brand-gray">
      <p className="eyebrow text-brand-blue">Security</p>
      <h2 className="mt-1 text-xl text-ink-900">Reset password</h2>
      <p className="mt-1 text-sm text-ink-500">Use your reset token and choose a strong new password.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Reset token</label>
          <Input value={token} onChange={(event) => setToken(event.target.value)} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">New password</label>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Set new password
        </Button>
      </form>

      <div className="mt-4 text-sm text-ink-500">
        Back to{" "}
        <Link className="text-brand-blue hover:underline" href="/login">
          Login
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="mx-auto max-w-md text-sm text-ink-500">Loading reset page...</Card>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
