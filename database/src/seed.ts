import { Prisma, PrismaClient, InstanceStatus, BillingType, ReferralStatus, QuoteStatus, InvoiceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const marketplaceSeed = [
  {
    slug: "nvidia-h100-80gb-us-east",
    name: "NVIDIA H100 Cluster",
    gpuType: "NVIDIA H100",
    provider: "Mintair Fabric",
    vramGb: 80,
    cpuCores: 32,
    memoryGb: 256,
    storageGb: 2000,
    pricePerHour: new Prisma.Decimal("6.9000"),
    region: "us-east-1",
    availability: 17,
    specs: { interconnect: "NVLink", networkGbps: 200, cuda: "12.6" }
  },
  {
    slug: "nvidia-a100-80gb-us-west",
    name: "NVIDIA A100 Optimized",
    gpuType: "NVIDIA A100",
    provider: "OrbitScale",
    vramGb: 80,
    cpuCores: 24,
    memoryGb: 192,
    storageGb: 1500,
    pricePerHour: new Prisma.Decimal("3.8500"),
    region: "us-west-2",
    availability: 31,
    specs: { interconnect: "PCIe", networkGbps: 100, cuda: "12.4" }
  },
  {
    slug: "nvidia-l40s-48gb-us-central",
    name: "NVIDIA L40S Compute",
    gpuType: "NVIDIA L40S",
    provider: "Mintair Fabric",
    vramGb: 48,
    cpuCores: 20,
    memoryGb: 128,
    storageGb: 1000,
    pricePerHour: new Prisma.Decimal("2.0500"),
    region: "us-central-1",
    availability: 56,
    specs: { interconnect: "PCIe", networkGbps: 50, cuda: "12.2" }
  },
  {
    slug: "nvidia-rtx-6000-ada-eu-west",
    name: "RTX 6000 Ada Workbench",
    gpuType: "RTX 6000 Ada",
    provider: "GraphFleet",
    vramGb: 48,
    cpuCores: 16,
    memoryGb: 96,
    storageGb: 1000,
    pricePerHour: new Prisma.Decimal("1.6000"),
    region: "eu-west-1",
    availability: 44,
    specs: { interconnect: "PCIe", networkGbps: 25, cuda: "12.2" }
  },
  {
    slug: "nvidia-4090-24gb-ap-south",
    name: "RTX 4090 Burst",
    gpuType: "RTX 4090",
    provider: "PeakForge",
    vramGb: 24,
    cpuCores: 12,
    memoryGb: 64,
    storageGb: 750,
    pricePerHour: new Prisma.Decimal("0.9800"),
    region: "ap-south-1",
    availability: 72,
    specs: { interconnect: "PCIe", networkGbps: 25, cuda: "12.1" }
  },
  {
    slug: "amd-mi300x-192gb-us-east",
    name: "AMD MI300X Dense AI",
    gpuType: "AMD MI300X",
    provider: "CoreMesh",
    vramGb: 192,
    cpuCores: 32,
    memoryGb: 384,
    storageGb: 2000,
    pricePerHour: new Prisma.Decimal("5.2500"),
    region: "us-east-2",
    availability: 11,
    specs: { interconnect: "Infinity Fabric", networkGbps: 200, rocm: "6.2" }
  }
];

function referralCodeFromEmail(email: string): string {
  const head = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "mint";
  return `${head.slice(0, 6).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function main() {
  await prisma.billingRecord.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.instanceLog.deleteMany();
  await prisma.instance.deleteMany();
  await prisma.sSHKey.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.creditTopUp.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.marketplaceItem.deleteMany();
  await prisma.user.deleteMany();

  for (const item of marketplaceSeed) {
    await prisma.marketplaceItem.create({ data: item });
  }

  const passwordHash = await bcrypt.hash("Mintair123!", 12);

  const alice = await prisma.user.create({
    data: {
      email: "alice@mintair.dev",
      passwordHash,
      fullName: "Alice Park",
      creditBalance: new Prisma.Decimal("400.00"),
      emailVerifiedAt: new Date(),
      onboardingCompleted: true,
      onboardingUserType: "Startup",
      onboardingUseCase: "LLM fine-tuning",
      onboardingRegion: "us-east-1",
      preferredRegion: "us-east-1",
      referralCode: referralCodeFromEmail("alice@mintair.dev")
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@mintair.dev",
      passwordHash,
      fullName: "Bob Singh",
      creditBalance: new Prisma.Decimal("100.00"),
      emailVerifiedAt: new Date(),
      onboardingCompleted: true,
      onboardingUserType: "Developer",
      onboardingUseCase: "Stable diffusion inference",
      onboardingRegion: "us-west-2",
      preferredRegion: "us-west-2",
      referralCode: referralCodeFromEmail("bob@mintair.dev")
    }
  });

  const firstGpu = await prisma.marketplaceItem.findFirstOrThrow({
    where: { gpuType: "NVIDIA H100" }
  });
  const secondGpu = await prisma.marketplaceItem.findFirstOrThrow({
    where: { gpuType: "NVIDIA A100" }
  });

  const aliceKey = await prisma.sSHKey.create({
    data: {
      userId: alice.id,
      name: "workstation",
      publicKey:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAII6nM8bxNqb+Ltxot9mJpbA3nXx1t6Ecuq9x5Q+Z5g4A alice@mintair",
      fingerprint: "SHA256:TLqnjK9QfGV9Vf8QPG34N18lEr6VEQqfWabFAoxvW8s"
    }
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const instanceOne = await prisma.instance.create({
    data: {
      userId: alice.id,
      marketplaceItemId: firstGpu.id,
      sshKeyId: aliceKey.id,
      name: "trainer-h100-01",
      region: "us-east-1",
      image: "ubuntu-22.04-cuda-12",
      status: InstanceStatus.RUNNING,
      costPerHour: firstGpu.pricePerHour,
      launchedAt: new Date(now.getTime() - 36 * 3600 * 1000),
      provisioningStartedAt: new Date(now.getTime() - 37 * 3600 * 1000),
      provisioningCompletedAt: new Date(now.getTime() - 36 * 3600 * 1000),
      provisioningEta: new Date(now.getTime() - 36 * 3600 * 1000),
      lastStatusChangeAt: new Date(now.getTime() - 36 * 3600 * 1000)
    }
  });

  const instanceTwo = await prisma.instance.create({
    data: {
      userId: alice.id,
      marketplaceItemId: secondGpu.id,
      name: "batch-a100-02",
      region: "us-west-2",
      image: "ubuntu-22.04-cuda-12",
      status: InstanceStatus.STOPPED,
      costPerHour: secondGpu.pricePerHour,
      launchedAt: new Date(now.getTime() - 72 * 3600 * 1000),
      provisioningStartedAt: new Date(now.getTime() - 73 * 3600 * 1000),
      provisioningCompletedAt: new Date(now.getTime() - 72 * 3600 * 1000),
      provisioningEta: new Date(now.getTime() - 72 * 3600 * 1000),
      lastStatusChangeAt: new Date(now.getTime() - 12 * 3600 * 1000)
    }
  });

  await prisma.instanceLog.createMany({
    data: [
      {
        instanceId: instanceOne.id,
        level: "INFO",
        message: "Provisioning completed and node joined cluster."
      },
      {
        instanceId: instanceOne.id,
        level: "INFO",
        message: "Runtime health check passed."
      },
      {
        instanceId: instanceTwo.id,
        level: "WARN",
        message: "Instance stopped by user request."
      }
    ]
  });

  for (let i = 0; i < 7; i += 1) {
    const recordedAt = new Date(oneWeekAgo.getTime() + i * 24 * 3600 * 1000);
    await prisma.usageRecord.createMany({
      data: [
        {
          userId: alice.id,
          instanceId: instanceOne.id,
          marketplaceItemId: firstGpu.id,
          metricType: "GPU_HOURS",
          quantity: new Prisma.Decimal((6 + i * 0.4).toFixed(2)),
          region: "us-east-1",
          recordedAt
        },
        {
          userId: alice.id,
          instanceId: instanceTwo.id,
          marketplaceItemId: secondGpu.id,
          metricType: "GPU_HOURS",
          quantity: new Prisma.Decimal((2 + i * 0.25).toFixed(2)),
          region: "us-west-2",
          recordedAt
        }
      ]
    });
  }

  const invoice = await prisma.invoice.create({
    data: {
      userId: alice.id,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEnd: now,
      totalAmount: new Prisma.Decimal("482.34"),
      status: InvoiceStatus.PENDING
    }
  });

  await prisma.billingRecord.createMany({
    data: [
      {
        userId: alice.id,
        instanceId: instanceOne.id,
        invoiceId: invoice.id,
        type: BillingType.DEBIT,
        description: "GPU compute charges",
        amount: new Prisma.Decimal("-318.40"),
        balanceAfter: new Prisma.Decimal("81.60"),
        currency: "USD"
      },
      {
        userId: alice.id,
        instanceId: instanceTwo.id,
        invoiceId: invoice.id,
        type: BillingType.DEBIT,
        description: "Batch compute charges",
        amount: new Prisma.Decimal("-113.94"),
        balanceAfter: new Prisma.Decimal("-32.34"),
        currency: "USD"
      },
      {
        userId: alice.id,
        type: BillingType.CREDIT,
        description: "Account top up",
        amount: new Prisma.Decimal("500.00"),
        balanceAfter: new Prisma.Decimal("400.00"),
        currency: "USD"
      }
    ]
  });

  await prisma.billingRecord.create({
    data: {
      userId: bob.id,
      type: BillingType.CREDIT,
      description: "Starter credit",
      amount: new Prisma.Decimal("100.00"),
      balanceAfter: new Prisma.Decimal("100.00"),
      currency: "USD"
    }
  });

  await prisma.paymentMethod.create({
    data: {
      userId: alice.id,
      type: "CARD",
      provider: "Stripe",
      brand: "Visa",
      last4: "4242",
      expMonth: 12,
      expYear: now.getFullYear() + 3,
      isDefault: true
    }
  });

  await prisma.quoteRequest.createMany({
    data: [
      {
        userId: alice.id,
        gpuType: "NVIDIA H100",
        quantity: 8,
        durationHours: 720,
        region: "us-east-1",
        notes: "Need dedicated rack with private networking",
        status: QuoteStatus.PENDING
      },
      {
        userId: alice.id,
        gpuType: "NVIDIA A100",
        quantity: 16,
        durationHours: 168,
        region: "us-west-2",
        notes: "Burst workload for launch week",
        status: QuoteStatus.APPROVED,
        reviewNotes: "Approved with 10% reserved pricing discount"
      }
    ]
  });

  await prisma.referral.create({
    data: {
      referrerId: alice.id,
      referredId: bob.id,
      code: alice.referralCode,
      status: ReferralStatus.PENDING,
      rewardAmount: new Prisma.Decimal("25.00")
    }
  });

  console.log("Seed complete.");
  console.log("Demo account: alice@mintair.dev / Mintair123!");
  console.log("Secondary account: bob@mintair.dev / Mintair123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
