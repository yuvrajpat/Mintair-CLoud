"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { CopyButton } from "../../../components/ui/copy-button";
import { Input } from "../../../components/ui/input";
import { Modal } from "../../../components/ui/modal";
import { Select } from "../../../components/ui/select";
import { api } from "../../../lib/api";
import { formatDate } from "../../../lib/format";

const tabs = ["profile", "security", "api-keys", "notifications"] as const;

type Tab = (typeof tabs)[number];

type SettingsPayload = {
  profile: {
    id: string;
    email: string;
    fullName: string;
    preferredRegion: string | null;
    notificationBilling: boolean;
    notificationProduct: boolean;
  };
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: string;
    revokedAt: string | null;
    expiresAt: string | null;
    lastUsedAt: string | null;
  }>;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");
  const [rawKeyModal, setRawKeyModal] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.profile() as Promise<SettingsPayload>
  });

  const [fullName, setFullName] = useState("");
  const [preferredRegion, setPreferredRegion] = useState("us-east-1");
  const [notificationBilling, setNotificationBilling] = useState(true);
  const [notificationProduct, setNotificationProduct] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [apiKeyName, setApiKeyName] = useState("Automation key");
  const [apiKeyExpiry, setApiKeyExpiry] = useState("");

  useEffect(() => {
    const profile = settingsQuery.data?.profile;
    if (!profile) {
      return;
    }

    setFullName(profile.fullName);
    setPreferredRegion(profile.preferredRegion ?? "us-east-1");
    setNotificationBilling(profile.notificationBilling);
    setNotificationProduct(profile.notificationProduct);
  }, [settingsQuery.data?.profile]);

  const profileMutation = useMutation({
    mutationFn: api.settings.updateProfile,
    onSuccess: async (data) => {
      toast.success(data.message);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not update profile.";
      toast.error(message);
    }
  });

  const passwordMutation = useMutation({
    mutationFn: api.settings.changePassword,
    onSuccess: (data) => {
      toast.success(data.message);
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not change password.";
      toast.error(message);
    }
  });

  const createKeyMutation = useMutation({
    mutationFn: api.settings.createApiKey,
    onSuccess: async (data) => {
      toast.success(data.message);
      setRawKeyModal(data.rawKey);
      setApiKeyName("Automation key");
      setApiKeyExpiry("");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not generate API key.";
      toast.error(message);
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: api.settings.revokeApiKey,
    onSuccess: async (data) => {
      toast.success(data.message);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not revoke API key.";
      toast.error(message);
    }
  });

  if (!settingsQuery.data) {
    return <Card className="text-sm text-ink-500">Loading settings...</Card>;
  }

  const profile = settingsQuery.data.profile;

  return (
    <div className="space-y-4">
      <Card className="relative border-brand-gray">
        <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap gap-2">
          {tabs.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`border px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em] transition ${
                tab === value
                  ? "border-brand-charcoal bg-brand-charcoal text-white"
                  : "border-brand-gray bg-white text-ink-600 hover:border-brand-charcoal hover:text-brand-blue"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </Card>

      {tab === "profile" ? (
        <Card className="border-brand-gray">
          <h3 className="text-base text-ink-900">Profile</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
              <Input value={profile.email} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Preferred region</label>
              <Input value={preferredRegion} onChange={(event) => setPreferredRegion(event.target.value)} />
            </div>
          </div>
          <Button
            className="mt-4"
            loading={profileMutation.isPending}
            onClick={() =>
              profileMutation.mutate({
                fullName,
                preferredRegion,
                notificationBilling,
                notificationProduct
              })
            }
          >
            Save profile
          </Button>
        </Card>
      ) : null}

      {tab === "security" ? (
        <Card className="border-brand-gray">
          <h3 className="text-base text-ink-900">Security</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
            />
          </div>
          <Button
            className="mt-4"
            loading={passwordMutation.isPending}
            onClick={() => passwordMutation.mutate({ currentPassword, newPassword })}
          >
            Change password
          </Button>
        </Card>
      ) : null}

      {tab === "api-keys" ? (
        <Card className="border-brand-gray">
          <h3 className="text-base text-ink-900">API keys</h3>
          <p className="mt-1 text-sm text-ink-500">Generate and revoke keys used by automation and integrations.</p>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} placeholder="Key name" />
            <Input
              type="date"
              value={apiKeyExpiry}
              onChange={(event) => setApiKeyExpiry(event.target.value)}
              placeholder="Expiry"
            />
            <Button
              loading={createKeyMutation.isPending}
              onClick={() => createKeyMutation.mutate({ name: apiKeyName, expiresAt: apiKeyExpiry || undefined })}
            >
              Generate key
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {settingsQuery.data.apiKeys.length ? (
              settingsQuery.data.apiKeys.map((key) => (
                <div key={key.id} className="flex flex-wrap items-center justify-between gap-2 border border-brand-gray px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{key.name}</p>
                    <p className="text-xs text-ink-400">
                      {key.keyPrefix}... • Created {formatDate(key.createdAt)}
                    </p>
                    {key.revokedAt ? <p className="text-xs text-rose-500">Revoked {formatDate(key.revokedAt)}</p> : null}
                  </div>
                  <Button
                    variant="danger"
                    disabled={Boolean(key.revokedAt)}
                    onClick={() => revokeKeyMutation.mutate(key.id)}
                    loading={revokeKeyMutation.isPending}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-500">No API keys yet.</p>
            )}
          </div>
        </Card>
      ) : null}

      {tab === "notifications" ? (
        <Card className="border-brand-gray">
          <h3 className="text-base text-ink-900">Notifications</h3>
          <div className="mt-3 space-y-3">
            <label className="flex items-center justify-between border border-brand-gray px-3 py-2 text-sm">
              <span>Product updates</span>
              <input
                type="checkbox"
                checked={notificationProduct}
                onChange={(event) => setNotificationProduct(event.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between border border-brand-gray px-3 py-2 text-sm">
              <span>Billing notifications</span>
              <input
                type="checkbox"
                checked={notificationBilling}
                onChange={(event) => setNotificationBilling(event.target.checked)}
              />
            </label>
          </div>

          <Button
            className="mt-4"
            loading={profileMutation.isPending}
            onClick={() =>
              profileMutation.mutate({
                fullName,
                preferredRegion,
                notificationBilling,
                notificationProduct
              })
            }
          >
            Save notification settings
          </Button>
        </Card>
      ) : null}

      <Modal
        open={Boolean(rawKeyModal)}
        title="API key generated"
        description="This secret is shown once. Copy and store it securely."
        onClose={() => setRawKeyModal(null)}
        actions={
          <>
            {rawKeyModal ? <CopyButton value={rawKeyModal} label="Copy key" /> : null}
            <Button variant="secondary" onClick={() => setRawKeyModal(null)}>
              Close
            </Button>
          </>
        }
      >
        <Input value={rawKeyModal ?? ""} readOnly />
      </Modal>
    </div>
  );
}
