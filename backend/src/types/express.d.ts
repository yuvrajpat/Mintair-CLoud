import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUser?: Pick<User, "id" | "email" | "fullName" | "onboardingCompleted" | "preferredRegion" | "emailVerifiedAt">;
      sessionToken?: string;
    }
  }
}

export {};
