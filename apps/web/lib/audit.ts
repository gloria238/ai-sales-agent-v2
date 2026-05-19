import { prisma } from "@salesagent/db";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: params as Prisma.AuditLogUncheckedCreateInput,
  });
}
