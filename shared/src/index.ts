import { z } from "zod";

export const regions = ["us-east-1", "us-east-2", "us-west-2", "us-central-1", "eu-west-1", "ap-south-1"] as const;

export const signupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  referralCode: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const onboardingSchema = z.object({
  userType: z.string().min(2),
  useCase: z.string().min(2),
  region: z.enum(regions)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
