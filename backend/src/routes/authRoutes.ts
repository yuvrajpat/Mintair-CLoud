import type { Response } from "express";
import { Router } from "express";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { createRawToken } from "../utils/crypto";
import {
  changePassword,
  createPasswordReset,
  createVerificationResend,
  getUserFromSession,
  login,
  loginWithGoogle,
  logout,
  resetPassword,
  signup,
  verifyEmail
} from "../services/authService";

const router = Router();
const GOOGLE_STATE_COOKIE_NAME = "mintair_google_oauth_state";

function getSessionCookieOptions() {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000
  };
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(env.SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

function getGoogleStateCookieOptions() {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: 10 * 60 * 1000
  };
}

function buildGoogleErrorRedirect(reason: string): string {
  const fallback = new URL("/login", env.APP_BASE_URL);
  fallback.searchParams.set("error", reason);

  if (!env.GOOGLE_ERROR_REDIRECT) {
    return fallback.toString();
  }

  try {
    const url = new URL(env.GOOGLE_ERROR_REDIRECT);
    url.searchParams.set("error", reason);
    return url.toString();
  } catch {
    return fallback.toString();
  }
}

function buildGoogleSuccessRedirect(onboardingCompleted: boolean): string {
  if (!onboardingCompleted) {
    return new URL("/onboarding", env.APP_BASE_URL).toString();
  }

  if (env.GOOGLE_SUCCESS_REDIRECT) {
    return env.GOOGLE_SUCCESS_REDIRECT;
  }

  return new URL("/dashboard", env.APP_BASE_URL).toString();
}

router.get("/google/start", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    res.redirect(buildGoogleErrorRedirect("google_not_configured"));
    return;
  }

  const state = createRawToken(24);
  res.cookie(GOOGLE_STATE_COOKIE_NAME, state, getGoogleStateCookieOptions());

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const { maxAge: _maxAge, ...stateCookieClearOptions } = getGoogleStateCookieOptions();
  const cookieState = req.cookies[GOOGLE_STATE_COOKIE_NAME] as string | undefined;
  res.clearCookie(GOOGLE_STATE_COOKIE_NAME, stateCookieClearOptions);

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    res.redirect(buildGoogleErrorRedirect("google_not_configured"));
    return;
  }

  if (!code || !state || !cookieState || cookieState !== state) {
    res.redirect(buildGoogleErrorRedirect("google_state_invalid"));
    return;
  }

  try {
    const result = await loginWithGoogle({
      authorizationCode: code,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    setSessionCookie(res, result.sessionToken);
    res.redirect(buildGoogleSuccessRedirect(result.user.onboardingCompleted));
  } catch {
    res.redirect(buildGoogleErrorRedirect("google_auth_failed"));
  }
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, fullName, password, referralCode } = req.body as {
      email: string;
      fullName: string;
      password: string;
      referralCode?: string;
    };

    const result = await signup({ email, fullName, password, referralCode });

    res.status(201).json({
      message: "Account created. Verify your email to continue.",
      user: result.user,
      verificationTokenPreview: result.verificationToken
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    setSessionCookie(res, result.sessionToken);

    res.json({
      message: "Logged in successfully.",
      user: result.user
    });
  })
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await logout(req.sessionToken);
    const { maxAge: _maxAge, ...clearCookieOptions } = getSessionCookieOptions();
    res.clearCookie(env.SESSION_COOKIE_NAME, clearCookieOptions);
    res.json({ message: "Logged out successfully." });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUserFromSession(req.sessionToken);
    res.json({ user });
  })
);

router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token: string };
    await verifyEmail({ token });
    res.json({ message: "Email verified successfully." });
  })
);

router.post(
  "/resend-verification",
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const result = await createVerificationResend({ email });
    res.json({
      message: "If the account exists and is unverified, a verification email has been sent.",
      verificationTokenPreview: result.token
    });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const result = await createPasswordReset({ email });
    res.json({
      message: "If the account exists, password reset instructions have been sent.",
      resetTokenPreview: result.resetToken
    });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };
    await resetPassword({ token, password });
    res.json({ message: "Password reset completed." });
  })
);

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await changePassword(req.authUser!.id, currentPassword, newPassword);
    res.json({ message: "Password updated." });
  })
);

export default router;
