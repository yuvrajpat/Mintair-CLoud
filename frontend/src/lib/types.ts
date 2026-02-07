export type User = {
  id: string;
  email: string;
  fullName: string;
  emailVerifiedAt: string | null;
  onboardingCompleted: boolean;
  onboardingUserType?: string | null;
  onboardingUseCase?: string | null;
  onboardingRegion?: string | null;
  preferredRegion?: string | null;
  notificationBilling: boolean;
  notificationProduct: boolean;
  referralCode: string;
};

export type MarketplaceItem = {
  id: string;
  slug: string;
  name: string;
  gpuType: string;
  provider: string;
  vramGb: number;
  cpuCores: number;
  memoryGb: number;
  storageGb: number;
  pricePerHour: number;
  region: string;
  availability: number;
  specs?: Record<string, string | number> | null;
};

export type Instance = {
  id: string;
  userId: string;
  marketplaceItemId: string;
  sshKeyId: string | null;
  name: string;
  region: string;
  image: string;
  status: "PROVISIONING" | "RUNNING" | "STOPPED" | "RESTARTING" | "TERMINATED" | "FAILED";
  costPerHour: number;
  launchedAt: string | null;
  terminatedAt: string | null;
  provisioningEta: string | null;
  provisioningStartedAt: string;
  provisioningCompletedAt: string | null;
  failureReason: string | null;
  lastStatusChangeAt: string;
  createdAt: string;
  updatedAt: string;
  marketplaceItem?: MarketplaceItem;
  sshKey?: {
    id: string;
    name: string;
    fingerprint: string;
  } | null;
  logs?: Array<{
    id: string;
    level: string;
    message: string;
    createdAt: string;
  }>;
};

export type SSHKey = {
  id: string;
  userId: string;
  name: string;
  publicKey: string;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
};

export type BillingOverview = {
  balance: number;
  monthlySpend: number;
  paymentMethods: Array<{
    id: string;
    provider: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  }>;
  invoices: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    totalAmount: number;
    status: string;
    issuedAt: string;
  }>;
  records: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  }>;
};

export type QuoteRequest = {
  id: string;
  gpuType: string;
  quantity: number;
  durationHours: number;
  region: string;
  notes?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes?: string | null;
  createdAt: string;
};
