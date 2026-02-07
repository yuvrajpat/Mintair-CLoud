import type { User } from "@prisma/client";
import { AuthProvider, Prisma, TokenType } from "@prisma/client";
import { nanoid } from "nanoid";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";
import { createRawToken, hashToken } from "../utils/crypto";
import { hashPassword, verifyPassword } from "../utils/password";
import { addHours } from "../utils/time";

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type SafeUser = Pick<
  User,
  | "id"
  | "email"
  | "fullName"
  | "emailVerifiedAt"
  | "onboardingCompleted"
  | "onboardingRegion"
  | "onboardingUseCase"
  | "onboardingUserType"
  | "preferredRegion"
  | "notificationBilling"
  | "notificationProduct"
  | "referralCode"
>;

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    emailVerifiedAt: user.emailVerifiedAt,
    onboardingCompleted: user.onboardingCompleted,
    onboardingRegion: user.onboardingRegion,
    onboardingUseCase: user.onboardingUseCase,
    onboardingUserType: user.onboardingUserType,
    preferredRegion: user.preferredRegion,
    notificationBilling: user.notificationBilling,
    notificationProduct: user.notificationProduct,
    referralCode: user.referralCode
  };
}

function validatePasswordStrength(password: string): void {
  const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];
  if (!rules.every((rule) => rule.test(password))) {
    throw new AppError(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
      400
    );
  }
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = nanoid(8).toUpperCase();
    const exists = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!exists) {
      return code;
    }
  }

  throw new AppError("Unable to create a referral code. Please retry.", 500);
}

async function createAuthToken(userId: string, type: TokenType, ttlHours: number): Promise<string> {
  const rawToken = createRawToken(32);
  const tokenHash = hashToken(rawToken);

  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash,
      expiresAt: addHours(new Date(), ttlHours)
    }
  });

  return rawToken;
}

async function createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const rawToken = createRawToken(32);
  const tokenHash = hashToken(rawToken);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt: addHours(new Date(), env.SESSION_TTL_HOURS)
    }
  });

  return rawToken;
}

export async function signup(input: {
  email: string;
  fullName: string;
  password: string;
  referralCode?: string;
}): Promise<{ user: SafeUser; verificationToken: string | null }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!email || !fullName || !password) {
    throw new AppError("Email, full name, and password are required.", 400);
  }

  validatePasswordStrength(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  let referrerId: string | null = null;
  const referralCode = input.referralCode?.trim().toUpperCase();
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode }, select: { id: true } });
    if (!referrer) {
      throw new AppError("Referral code is invalid.", 400);
    }
    referrerId = referrer.id;
  }

  const passwordHash = await hashPassword(password);
  const userReferralCode = await generateUniqueReferralCode();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        referralCode: userReferralCode
      }
    });

    await tx.billingRecord.create({
      data: {
        userId: created.id,
        type: "CREDIT",
        description: "Starter credit",
        amount: new Prisma.Decimal(env.DEFAULT_CREDIT_USD.toFixed(2)),
        balanceAfter: new Prisma.Decimal(env.DEFAULT_CREDIT_USD.toFixed(2)),
        currency: "USD"
      }
    });

    if (referrerId) {
      await tx.referral.create({
        data: {
          referrerId,
          referredId: created.id,
          code: referralCode!,
          rewardAmount: new Prisma.Decimal(env.REFERRAL_REWARD_USD.toFixed(2))
        }
      });
    }

    return created;
  });

  const verificationToken = await createAuthToken(user.id, TokenType.EMAIL_VERIFY, 24);
  return {
    user: toSafeUser(user),
    verificationToken: env.DEV_EMAIL_PREVIEW ? verificationToken : null
  };
}

export async function login(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ user: SafeUser; sessionToken: string }> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError("Invalid credentials.", 401);
  }

  if (!user.emailVerifiedAt) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  const sessionToken = await createSession(user.id, input.ipAddress, input.userAgent);

  return {
    user: toSafeUser(user),
    sessionToken
  };
}

export async function loginWithGoogle(input: {
  authorizationCode: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ user: SafeUser; sessionToken: string }> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new AppError("Google sign-in is not configured.", 500);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.authorizationCode,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code"
    })
  });

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new AppError("Google sign-in failed while exchanging credentials.", 401);
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  const profile = (await profileResponse.json()) as GoogleUserInfo;
  if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified === false) {
    throw new AppError("Google account details are incomplete or unverified.", 401);
  }

  const email = profile.email.trim().toLowerCase();
  const fullName = profile.name?.trim() || email.split("@")[0] || "Mintair User";

  const existingByGoogle = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  const existingByEmail = await prisma.user.findUnique({ where: { email } });

  if (existingByGoogle && existingByEmail && existingByGoogle.id !== existingByEmail.id) {
    throw new AppError("This Google account is already linked to another user.", 409);
  }

  const user = await prisma.$transaction(async (tx) => {
    if (existingByGoogle || existingByEmail) {
      const existing = existingByGoogle ?? existingByEmail!;
      return tx.user.update({
        where: { id: existing.id },
        data: {
          googleId: existing.googleId ?? profile.sub,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          fullName: existing.fullName || fullName
        }
      });
    }

    const referralCode = await generateUniqueReferralCode();
    const passwordHash = await hashPassword(createRawToken(32));

    const created = await tx.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        referralCode,
        authProvider: AuthProvider.GOOGLE,
        googleId: profile.sub,
        emailVerifiedAt: new Date()
      }
    });

    await tx.billingRecord.create({
      data: {
        userId: created.id,
        type: "CREDIT",
        description: "Starter credit",
        amount: new Prisma.Decimal(env.DEFAULT_CREDIT_USD.toFixed(2)),
        balanceAfter: new Prisma.Decimal(env.DEFAULT_CREDIT_USD.toFixed(2)),
        currency: "USD"
      }
    });

    return created;
  });

  const sessionToken = await createSession(user.id, input.ipAddress, input.userAgent);
  return {
    user: toSafeUser(user),
    sessionToken
  };
}

export async function logout(rawToken?: string): Promise<void> {
  if (!rawToken) {
    return;
  }

  await prisma.session.updateMany({
    where: {
      tokenHash: hashToken(rawToken),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function getUserFromSession(rawToken?: string): Promise<SafeUser | null> {
  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(rawToken),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true
    }
  });

  if (!session) {
    return null;
  }

  return toSafeUser(session.user);
}

export async function createPasswordReset(input: { email: string }): Promise<{ resetToken: string | null }> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (!user) {
    return { resetToken: null };
  }

  const resetToken = await createAuthToken(user.id, TokenType.PASSWORD_RESET, 2);
  return {
    resetToken: env.DEV_EMAIL_PREVIEW ? resetToken : null
  };
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  validatePasswordStrength(input.password);

  const tokenHash = hashToken(input.token);
  const token = await prisma.authToken.findFirst({
    where: {
      tokenHash,
      type: TokenType.PASSWORD_RESET,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!token) {
    throw new AppError("Reset token is invalid or expired.", 400);
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash }
    });

    await tx.authToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    });

    await tx.session.updateMany({
      where: { userId: token.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  });
}

export async function verifyEmail(input: { token: string }): Promise<void> {
  const tokenHash = hashToken(input.token);
  const token = await prisma.authToken.findFirst({
    where: {
      tokenHash,
      type: TokenType.EMAIL_VERIFY,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!token) {
    throw new AppError("Verification token is invalid or expired.", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: new Date() }
    });

    await tx.authToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    });
  });
}

export async function createVerificationResend(input: { email: string }): Promise<{ token: string | null }> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true } });

  if (!user || user.emailVerifiedAt) {
    return { token: null };
  }

  const token = await createAuthToken(user.id, TokenType.EMAIL_VERIFY, 24);
  return { token: env.DEV_EMAIL_PREVIEW ? token : null };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  validatePasswordStrength(newPassword);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const validCurrent = await verifyPassword(currentPassword, user.passwordHash);
  if (!validCurrent) {
    throw new AppError("Current password is incorrect.", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
}
