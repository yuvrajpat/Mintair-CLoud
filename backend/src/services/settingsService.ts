import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";
import { createApiKey } from "../utils/crypto";

export async function getSettingsProfile(userId: string) {
  const [user, apiKeys] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        preferredRegion: true,
        notificationBilling: true,
        notificationProduct: true
      }
    }),
    prisma.aPIKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return {
    profile: user,
    apiKeys: apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt
    }))
  };
}

export async function updateProfile(
  userId: string,
  input: { fullName: string; preferredRegion?: string; notificationBilling?: boolean; notificationProduct?: boolean }
) {
  if (!input.fullName.trim()) {
    throw new AppError("Full name is required.", 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName.trim(),
      preferredRegion: input.preferredRegion,
      notificationBilling: input.notificationBilling,
      notificationProduct: input.notificationProduct
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      preferredRegion: true,
      notificationBilling: true,
      notificationProduct: true
    }
  });
}

export async function createUserApiKey(userId: string, input: { name: string; expiresAt?: string }) {
  if (!input.name.trim()) {
    throw new AppError("API key name is required.", 400);
  }

  const { raw, prefix, hash } = createApiKey();

  const apiKey = await prisma.aPIKey.create({
    data: {
      userId,
      name: input.name.trim(),
      keyPrefix: prefix,
      keyHash: hash,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
    }
  });

  return {
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt
    },
    rawKey: raw
  };
}

export async function revokeUserApiKey(userId: string, keyId: string) {
  const key = await prisma.aPIKey.findFirst({ where: { id: keyId, userId, revokedAt: null } });
  if (!key) {
    throw new AppError("API key not found.", 404);
  }

  return prisma.aPIKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() }
  });
}
