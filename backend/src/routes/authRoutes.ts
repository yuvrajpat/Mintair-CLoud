import type { Response } from "express";
import { Router } from "express";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  changePassword,
  createPasswordReset,
  createVerificationResend,
  getUserFromSession,
  login,
  logout,
  resetPassword,
  signup,
  verifyEmail
} from "../services/authService";

const router = Router();

function setSessionCookie(res: Response, token: string) {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000
  });
}

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
    res.clearCookie(env.SESSION_COOKIE_NAME);
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
