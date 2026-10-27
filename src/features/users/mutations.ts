import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

export interface PendingRoleAssignmentPayload {
  email: string;
  role: Role;
  officerPosition: OfficerPosition | null;
  allowExternalEmail: boolean;
  assignedById: string;
}

export interface OfficerPositionPayload {
  userId: string;
  officerPosition: OfficerPosition | null;
}

export async function ensureDeveloperUser(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return;

  try {
    await prisma.user.create({
      data: { email, name: "Developer Account", role: "DEV" },
    });
  } catch (error) {
    const concurrentUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!concurrentUser) throw error;
  }
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { role, ...(role === Role.OFFICER ? {} : { officerPosition: null }) },
  });
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive, ...(isActive ? {} : { officerPosition: null }) },
  });
}

export async function upsertPendingRoleAssignment(
  payload: PendingRoleAssignmentPayload,
): Promise<void> {
  const { email, role, allowExternalEmail, assignedById } = payload;
  const officerPosition = role === Role.OFFICER ? payload.officerPosition : null;
  await prisma.pendingRoleAssignment.upsert({
    where: { email },
    update: {
      role,
      officerPosition,
      allowExternalEmail,
      assignedById,
      assignedAt: new Date(),
    },
    create: { email, role, officerPosition, allowExternalEmail, assignedById },
  });
}

export async function deletePendingRoleAssignment(roleAssignmentId: string): Promise<void> {
  await prisma.pendingRoleAssignment.delete({ where: { id: roleAssignmentId } });
}

export async function setOfficerPosition(payload: OfficerPositionPayload): Promise<void> {
  const { userId, officerPosition } = payload;
  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!target) throw new Error("User not found");
    if (target.role !== Role.OFFICER) throw new Error("Only officers can hold a position");

    if (officerPosition === OfficerPosition.PRESIDENT) {
      await tx.user.updateMany({
        where: {
          officerPosition: OfficerPosition.PRESIDENT,
          id: { not: userId },
        },
        data: { officerPosition: null },
      });
    }

    await tx.user.update({ where: { id: userId }, data: { officerPosition } });
  });
}
