import { Role, type OfficerPosition } from "@/generated/prisma/browser";

export const assignableRoles = [Role.STUDENT, Role.OFFICER, Role.ADMIN] as const;

export type AssignableRole = (typeof assignableRoles)[number];

export function isAssignableRole(role: Role): role is AssignableRole {
  return assignableRoles.some((assignable) => assignable === role);
}

export const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  OFFICER: "Officer",
  ADMIN: "Admin",
  DEV: "Dev",
};

export const officerPositionLabels: Record<OfficerPosition, string> = {
  PRESIDENT: "President",
};
