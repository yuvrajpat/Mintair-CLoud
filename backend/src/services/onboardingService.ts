import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";

export async function getOnboardingState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompleted: true,
      onboardingUserType: true,
      onboardingUseCase: true,
      onboardingRegion: true
    }
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
}

export async function completeOnboarding(
  userId: string,
  input: { userType: string; useCase: string; region: string }
) {
  if (!input.userType || !input.useCase || !input.region) {
    throw new AppError("All onboarding fields are required.", 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      onboardingCompleted: true,
      onboardingUserType: input.userType,
      onboardingUseCase: input.useCase,
      onboardingRegion: input.region,
      preferredRegion: input.region
    },
    select: {
      id: true,
      onboardingCompleted: true,
      onboardingUserType: true,
      onboardingUseCase: true,
      onboardingRegion: true
    }
  });
}
