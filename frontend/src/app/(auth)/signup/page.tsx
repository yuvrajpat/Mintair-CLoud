"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { CopyButton } from "../../../components/ui/copy-button";
import { Input } from "../../../components/ui/input";
import { api } from "../../../lib/api";

export const dynamic = "force-dynamic";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCodeFromUrl = useMemo(() => searchParams.get("ref") ?? "", [searchParams]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl);
  const [verificationTokenPreview, setVerificationTokenPreview] = useState<string | null>(null);

  const signupMutation = useMutation({
    mutationFn: api.auth.signup,
    onSuccess: (data) => {
      setVerificationTokenPreview(data.verificationTokenPreview ?? null);
      toast.success("Account created. Verify your email.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not create account.";
      toast.error(message);
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    signupMutation.mutate({
      fullName,
      email,
      password,
      referralCode: referralCode.trim() || undefined
    });
  };

  return (
    <Card className="mx-auto max-w-lg border-brand-gray">
      <p className="eyebrow text-brand-blue">Registration</p>
      <h2 className="mt-1 text-xl text-ink-900">Create account</h2>
      <p className="mt-1 text-sm text-ink-500">Start deploying compute after a quick onboarding flow.</p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Min 8 chars, upper/lower/number/symbol"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Referral code (optional)</label>
          <Input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} />
        </div>

        <Button type="submit" className="w-full" loading={signupMutation.isPending}>
          Sign Up
        </Button>
      </form>

      {verificationTokenPreview ? (
        <div className="mt-4 border border-brand-gray bg-white p-3 text-sm">
          <p className="font-medium text-brand-charcoal">Development verification token</p>
          <p className="mt-1 break-all text-brand-blue">{verificationTokenPreview}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyButton value={verificationTokenPreview} label="Copy token" />
            <Button variant="secondary" onClick={() => router.push(`/verify-email?token=${verificationTokenPreview}`)}>
              Verify now
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-sm text-ink-500">
        Already have an account?{" "}
        <Link className="text-brand-blue hover:underline" href="/login">
          Login
        </Link>
      </div>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Card className="mx-auto max-w-lg text-sm text-ink-500">Loading signup form...</Card>}>
      <SignupPageContent />
    </Suspense>
  );
}
