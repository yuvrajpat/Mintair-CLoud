import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { getUserFromSession } from "../services/authService";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = req.cookies?.[env.SESSION_COOKIE_NAME] as string | undefined;
  const user = await getUserFromSession(sessionToken);

  if (!user) {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
    return;
  }

  req.authUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    onboardingCompleted: user.onboardingCompleted,
    preferredRegion: user.preferredRegion,
    emailVerifiedAt: user.emailVerifiedAt,
    creditBalance: user.creditBalance
  };
  req.sessionToken = sessionToken;
  next();
}
