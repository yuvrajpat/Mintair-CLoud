import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";
import { fingerprintPublicKey, validateSshPublicKey } from "../utils/ssh";

export async function listSshKeys(userId: string) {
  return prisma.sSHKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function addSshKey(userId: string, input: { name: string; publicKey: string }) {
  const name = input.name.trim();
  const publicKey = input.publicKey.trim();

  if (!name || !publicKey) {
    throw new AppError("SSH key name and public key are required.", 400);
  }

  validateSshPublicKey(publicKey);
  const fingerprint = fingerprintPublicKey(publicKey);

  return prisma.sSHKey.create({
    data: {
      userId,
      name,
      publicKey,
      fingerprint
    }
  });
}

export async function renameSshKey(userId: string, keyId: string, name: string) {
  const key = await prisma.sSHKey.findFirst({ where: { id: keyId, userId } });
  if (!key) {
    throw new AppError("SSH key not found.", 404);
  }

  return prisma.sSHKey.update({
    where: { id: keyId },
    data: { name: name.trim() }
  });
}

export async function deleteSshKey(userId: string, keyId: string) {
  const key = await prisma.sSHKey.findFirst({ where: { id: keyId, userId } });
  if (!key) {
    throw new AppError("SSH key not found.", 404);
  }

  await prisma.instance.updateMany({
    where: { sshKeyId: keyId, userId },
    data: { sshKeyId: null }
  });

  await prisma.sSHKey.delete({ where: { id: keyId } });
}
