declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        fullName: string;
        onboardingCompleted: boolean;
        preferredRegion: string | null;
        emailVerifiedAt: Date | null;
        creditBalance: number;
      };
      sessionToken?: string;
      rawBody?: string;
    }
  }
}

export {};
