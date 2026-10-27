import { OfficerPosition, type Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

/** The database fields a pending invitation contributes on first sign-in. */
export interface PendingAssignment {
  name: string;
  image: string | null;
  role: Role;
  officerPosition: OfficerPosition | null;
  allowExternalEmail: boolean;
}

/**
 * Creates the invited user and consumes the pending assignment atomically.
 *
 * A pending President replaces the current President in the same transaction,
 * so the partial unique index never sees two Presidents.
 *
 * @param email - Normalized school or approved external email.
 * @param assignment - Role, position, profile, and email-bypass fields.
 * @returns A promise that resolves after the user is created and the invitation is removed.
 */
export async function applyPendingAssignment(
  email: string,
  assignment: PendingAssignment,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (assignment.officerPosition === OfficerPosition.PRESIDENT) {
      await tx.user.updateMany({
        where: { officerPosition: OfficerPosition.PRESIDENT },
        data: { officerPosition: null },
      });
    }

    await tx.user.create({
      data: {
        email,
        name: assignment.name,
        image: assignment.image,
        role: assignment.role,
        officerPosition: assignment.officerPosition,
        allowExternalEmail: assignment.allowExternalEmail,
      },
    });

    await tx.pendingRoleAssignment.delete({ where: { email } });
  });
}
