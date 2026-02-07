"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Input } from "../../../components/ui/input";
import { Modal } from "../../../components/ui/modal";
import { Textarea } from "../../../components/ui/textarea";
import { api } from "../../../lib/api";
import { formatDate } from "../../../lib/format";
import type { SSHKey } from "../../../lib/types";

export default function SshKeysPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [editingKey, setEditingKey] = useState<SSHKey | null>(null);
  const [newName, setNewName] = useState("");
  const [deletingKey, setDeletingKey] = useState<SSHKey | null>(null);

  const keysQuery = useQuery({
    queryKey: ["ssh-keys"],
    queryFn: () => api.sshKeys.list() as Promise<{ keys: SSHKey[] }>
  });

  const createMutation = useMutation({
    mutationFn: api.sshKeys.add,
    onSuccess: async (data) => {
      toast.success(data.message);
      setName("");
      setPublicKey("");
      await queryClient.invalidateQueries({ queryKey: ["ssh-keys"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not add SSH key.";
      toast.error(message);
    }
  });

  const renameMutation = useMutation({
    mutationFn: (payload: { id: string; name: string }) => api.sshKeys.rename(payload.id, { name: payload.name }),
    onSuccess: async (data) => {
      toast.success(data.message);
      setEditingKey(null);
      await queryClient.invalidateQueries({ queryKey: ["ssh-keys"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not rename SSH key.";
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.sshKeys.remove(id),
    onSuccess: async (data) => {
      toast.success(data.message);
      setDeletingKey(null);
      await queryClient.invalidateQueries({ queryKey: ["ssh-keys"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not delete SSH key.";
      toast.error(message);
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({ name, publicKey });
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-base font-semibold text-ink-900">Add SSH Key</h3>
        <p className="mt-1 text-sm text-ink-500">Attach SSH keys during deployment for secure shell access.</p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Public key</label>
            <Textarea
              rows={4}
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder="ssh-ed25519 AAAA..."
              required
            />
          </div>

          <Button type="submit" loading={createMutation.isPending}>
            Add key
          </Button>
        </form>
      </Card>

      {keysQuery.data?.keys.length ? (
        <div className="space-y-3">
          {keysQuery.data.keys.map((key) => (
            <Card key={key.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-ink-900">{key.name}</h4>
                  <p className="mt-1 text-sm text-ink-500">{key.fingerprint}</p>
                  <p className="mt-1 text-xs text-ink-400">Added {formatDate(key.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingKey(key);
                      setNewName(key.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button variant="danger" onClick={() => setDeletingKey(key)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No SSH keys" description="Add a public key to enable SSH access on deployments." />
      )}

      <Modal
        open={Boolean(editingKey)}
        title="Rename SSH key"
        onClose={() => setEditingKey(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingKey(null)}>
              Cancel
            </Button>
            <Button
              loading={renameMutation.isPending}
              onClick={() => {
                if (editingKey) {
                  renameMutation.mutate({ id: editingKey.id, name: newName });
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Input value={newName} onChange={(event) => setNewName(event.target.value)} />
      </Modal>

      <Modal
        open={Boolean(deletingKey)}
        title="Delete SSH key"
        description="Instances using this key will be detached from it."
        onClose={() => setDeletingKey(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeletingKey(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (deletingKey) {
                  deleteMutation.mutate(deletingKey.id);
                }
              }}
            >
              Delete key
            </Button>
          </>
        }
      />
    </div>
  );
}
