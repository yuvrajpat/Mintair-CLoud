import { BillingType, InstanceStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";
import { addMinutes } from "../utils/time";
import { rewardReferralForFirstDeployment } from "./referralService";

function shouldFailProvisioning(instanceId: string): boolean {
  const code = instanceId.charCodeAt(instanceId.length - 1);
  return code % 11 === 0;
}

async function getCurrentBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true }
  });

  return Number(user?.creditBalance ?? 0);
}

function mapInstance(instance: {
  id: string;
  userId: string;
  marketplaceItemId: string;
  sshKeyId: string | null;
  name: string;
  region: string;
  image: string;
  status: InstanceStatus;
  costPerHour: Prisma.Decimal;
  launchedAt: Date | null;
  terminatedAt: Date | null;
  provisioningStartedAt: Date;
  provisioningCompletedAt: Date | null;
  provisioningEta: Date | null;
  failureReason: string | null;
  lastStatusChangeAt: Date;
  createdAt: Date;
  updatedAt: Date;
  marketplaceItem?: {
    id: string;
    name: string;
    gpuType: string;
    provider: string;
    vramGb: number;
  };
  sshKey?: {
    id: string;
    name: string;
    fingerprint: string;
  } | null;
}) {
  return {
    ...instance,
    costPerHour: Number(instance.costPerHour)
  };
}

export async function reconcileInstanceState(instanceId: string): Promise<void> {
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  if (!instance || !instance.provisioningEta) {
    return;
  }

  if ((instance.status !== InstanceStatus.PROVISIONING && instance.status !== InstanceStatus.RESTARTING) || instance.provisioningEta > new Date()) {
    return;
  }

  if (shouldFailProvisioning(instance.id) && instance.status === InstanceStatus.PROVISIONING) {
    await prisma.instance.update({
      where: { id: instance.id },
      data: {
        status: InstanceStatus.FAILED,
        failureReason: "Node image checksum mismatch during provisioning.",
        lastStatusChangeAt: new Date(),
        provisioningCompletedAt: new Date()
      }
    });

    await prisma.instanceLog.create({
      data: {
        instanceId: instance.id,
        level: "ERROR",
        message: "Provisioning failed due to image checksum mismatch."
      }
    });

    return;
  }

  await prisma.instance.update({
    where: { id: instance.id },
    data: {
      status: InstanceStatus.RUNNING,
      launchedAt: instance.launchedAt ?? new Date(),
      provisioningCompletedAt: new Date(),
      lastStatusChangeAt: new Date(),
      failureReason: null
    }
  });

  await prisma.instanceLog.create({
    data: {
      instanceId: instance.id,
      level: "INFO",
      message: instance.status === InstanceStatus.RESTARTING ? "Instance restart complete." : "Provisioning completed successfully."
    }
  });
}

export async function deployInstance(
  userId: string,
  input: {
    marketplaceItemId: string;
    name: string;
    region: string;
    image: string;
    sshKeyId?: string;
  }
) {
  if (!input.marketplaceItemId || !input.name || !input.region || !input.image) {
    throw new AppError("Missing required deployment configuration.", 400);
  }

  const [item, sshKey, existingCount, balance] = await Promise.all([
    prisma.marketplaceItem.findUnique({ where: { id: input.marketplaceItemId } }),
    input.sshKeyId
      ? prisma.sSHKey.findFirst({
          where: {
            id: input.sshKeyId,
            userId
          }
        })
      : Promise.resolve(null),
    prisma.instance.count({ where: { userId } }),
    getCurrentBalance(userId)
  ]);

  if (!item) {
    throw new AppError("Selected marketplace item is unavailable.", 404);
  }

  if (item.availability <= 0) {
    throw new AppError("Selected configuration is temporarily out of capacity.", 409);
  }

  if (input.sshKeyId && !sshKey) {
    throw new AppError("SSH key not found for this account.", 404);
  }

  const firstHourCost = Number(item.pricePerHour);
  if (balance < firstHourCost) {
    throw new AppError("Insufficient balance. Add funds before deploying this instance.", 402);
  }

  const nextBalance = balance - firstHourCost;
  const provisioningEta = addMinutes(new Date(), 2);

  const instance = await prisma.$transaction(async (tx) => {
    const created = await tx.instance.create({
      data: {
        userId,
        marketplaceItemId: item.id,
        sshKeyId: sshKey?.id,
        name: input.name.trim(),
        region: input.region,
        image: input.image,
        status: InstanceStatus.PROVISIONING,
        costPerHour: item.pricePerHour,
        provisioningEta,
        provisioningStartedAt: new Date(),
        lastStatusChangeAt: new Date()
      },
      include: {
        marketplaceItem: true,
        sshKey: {
          select: { id: true, name: true, fingerprint: true }
        }
      }
    });

    await tx.marketplaceItem.update({
      where: { id: item.id },
      data: { availability: { decrement: 1 } }
    });

    await tx.billingRecord.create({
      data: {
        userId,
        instanceId: created.id,
        type: BillingType.DEBIT,
        description: `Deployment hold for ${created.name}`,
        amount: new Prisma.Decimal((-firstHourCost).toFixed(2)),
        balanceAfter: new Prisma.Decimal(nextBalance.toFixed(2))
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: new Prisma.Decimal(nextBalance.toFixed(2))
      }
    });

    await tx.instanceLog.create({
      data: {
        instanceId: created.id,
        level: "INFO",
        message: "Deployment request accepted. Provisioning started."
      }
    });

    return created;
  });

  if (existingCount === 0) {
    await rewardReferralForFirstDeployment(userId);
  }

  return mapInstance(instance);
}

export async function listInstances(userId: string) {
  const instances = await prisma.instance.findMany({
    where: { userId },
    include: {
      marketplaceItem: {
        select: { id: true, name: true, gpuType: true, provider: true, vramGb: true }
      },
      sshKey: {
        select: { id: true, name: true, fingerprint: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  await Promise.all(instances.map((instance) => reconcileInstanceState(instance.id)));

  const refreshed = await prisma.instance.findMany({
    where: { userId },
    include: {
      marketplaceItem: {
        select: { id: true, name: true, gpuType: true, provider: true, vramGb: true }
      },
      sshKey: {
        select: { id: true, name: true, fingerprint: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return refreshed.map(mapInstance);
}

export async function getInstanceDetail(userId: string, instanceId: string) {
  await reconcileInstanceState(instanceId);

  const instance = await prisma.instance.findFirst({
    where: {
      id: instanceId,
      userId
    },
    include: {
      marketplaceItem: true,
      sshKey: {
        select: { id: true, name: true, fingerprint: true }
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 100
      }
    }
  });

  if (!instance) {
    throw new AppError("Instance not found.", 404);
  }

  return mapInstance(instance);
}

export async function getInstanceMetrics(userId: string, instanceId: string) {
  const instance = await prisma.instance.findFirst({
    where: { id: instanceId, userId },
    select: { id: true, createdAt: true }
  });

  if (!instance) {
    throw new AppError("Instance not found.", 404);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const usage = await prisma.usageRecord.findMany({
    where: {
      userId,
      instanceId,
      recordedAt: { gte: since }
    },
    orderBy: { recordedAt: "asc" }
  });

  const normalized = usage.map((entry) => ({
    timestamp: entry.recordedAt,
    gpuHours: Number(entry.quantity)
  }));

  return {
    datapoints: normalized,
    summary: {
      totalGpuHours: Number(usage.reduce((sum, entry) => sum + Number(entry.quantity), 0).toFixed(2)),
      points: usage.length
    }
  };
}

async function transitionInstanceStatus(
  userId: string,
  instanceId: string,
  action: "start" | "stop" | "restart" | "terminate"
) {
  const instance = await prisma.instance.findFirst({
    where: { id: instanceId, userId },
    include: { marketplaceItem: true }
  });

  if (!instance) {
    throw new AppError("Instance not found.", 404);
  }

  await reconcileInstanceState(instance.id);

  const current = await prisma.instance.findUniqueOrThrow({ where: { id: instance.id } });

  if (action === "start") {
    if (current.status !== InstanceStatus.STOPPED) {
      throw new AppError("Only stopped instances can be started.", 409);
    }

    const updated = await prisma.instance.update({
      where: { id: current.id },
      data: {
        status: InstanceStatus.RUNNING,
        lastStatusChangeAt: new Date()
      },
      include: {
        marketplaceItem: true,
        sshKey: { select: { id: true, name: true, fingerprint: true } }
      }
    });

    await prisma.instanceLog.create({
      data: { instanceId: current.id, level: "INFO", message: "Instance started." }
    });

    return mapInstance(updated);
  }

  if (action === "stop") {
    if (current.status !== InstanceStatus.RUNNING) {
      throw new AppError("Only running instances can be stopped.", 409);
    }

    const updated = await prisma.instance.update({
      where: { id: current.id },
      data: {
        status: InstanceStatus.STOPPED,
        lastStatusChangeAt: new Date()
      },
      include: {
        marketplaceItem: true,
        sshKey: { select: { id: true, name: true, fingerprint: true } }
      }
    });

    await prisma.instanceLog.create({
      data: { instanceId: current.id, level: "INFO", message: "Instance stopped." }
    });

    return mapInstance(updated);
  }

  if (action === "restart") {
    if (current.status !== InstanceStatus.RUNNING && current.status !== InstanceStatus.STOPPED) {
      throw new AppError("Only running or stopped instances can be restarted.", 409);
    }

    const updated = await prisma.instance.update({
      where: { id: current.id },
      data: {
        status: InstanceStatus.RESTARTING,
        provisioningEta: addMinutes(new Date(), 1),
        lastStatusChangeAt: new Date()
      },
      include: {
        marketplaceItem: true,
        sshKey: { select: { id: true, name: true, fingerprint: true } }
      }
    });

    await prisma.instanceLog.create({
      data: { instanceId: current.id, level: "INFO", message: "Instance restarting." }
    });

    return mapInstance(updated);
  }

  if (current.status === InstanceStatus.TERMINATED) {
    throw new AppError("This instance is already terminated.", 409);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const terminated = await tx.instance.update({
      where: { id: current.id },
      data: {
        status: InstanceStatus.TERMINATED,
        terminatedAt: new Date(),
        lastStatusChangeAt: new Date()
      },
      include: {
        marketplaceItem: true,
        sshKey: { select: { id: true, name: true, fingerprint: true } }
      }
    });

    await tx.marketplaceItem.update({
      where: { id: current.marketplaceItemId },
      data: { availability: { increment: 1 } }
    });

    await tx.instanceLog.create({
      data: { instanceId: current.id, level: "WARN", message: "Instance terminated by user." }
    });

    return terminated;
  });

  return mapInstance(updated);
}

export async function startInstance(userId: string, instanceId: string) {
  return transitionInstanceStatus(userId, instanceId, "start");
}

export async function stopInstance(userId: string, instanceId: string) {
  return transitionInstanceStatus(userId, instanceId, "stop");
}

export async function restartInstance(userId: string, instanceId: string) {
  return transitionInstanceStatus(userId, instanceId, "restart");
}

export async function terminateInstance(userId: string, instanceId: string) {
  return transitionInstanceStatus(userId, instanceId, "terminate");
}

export async function getInstanceLogs(userId: string, instanceId: string) {
  const instance = await prisma.instance.findFirst({
    where: { id: instanceId, userId },
    select: { id: true }
  });

  if (!instance) {
    throw new AppError("Instance not found.", 404);
  }

  return prisma.instanceLog.findMany({
    where: { instanceId },
    orderBy: { createdAt: "desc" },
    take: 200
  });
}
