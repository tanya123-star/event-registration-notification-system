/**
 * Centralized RBAC policy for the single-organization KASAMA system.
 *
 * {@link PERMISSION_MATRIX} is the single source of truth for what each role
 * may do, transcribed from `documentation/RBAC.md`. Row scope (own event, own
 * task, assigned event) is enforced by feature queries and mutations, not by a
 * matrix qualifier.
 *
 * Capabilities are enforced by `requirePermission(...)` guards. The module is
 * pure and client-safe: it imports only the Prisma `Role` and
 * `OfficerPosition` values from the `browser` entry.
 */

import { OfficerPosition, Role } from "@/generated/prisma/browser";

/** Shared user-facing message for denied actions. */
export const FORBIDDEN_MESSAGE = "You don't have permission to perform this action.";

/**
 * Access level a role has on a capability.
 *
 * - `"yes"` - granted.
 * - `"no"` - denied under any circumstance.
 */
export type AccessLevel = "yes" | "no";

/**
 * Granular capability a role may or may not perform, named `entity.action`.
 *
 * Deny-by-default and enforced exclusively through `requirePermission(...)`.
 */
export type Permission =
  | "user.read"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "event.read_published"
  | "event.read_all"
  | "event.create"
  | "event.edit"
  | "event.submit"
  | "event.approve"
  | "event.cancel"
  | "registration.create"
  | "registration.cancel"
  | "registration.read_own"
  | "registration.read_event"
  | "attendance.scan"
  | "attendance.manual"
  | "attendance.view"
  | "task.create"
  | "task.read_own"
  | "task.read_assigned"
  | "task.read_all"
  | "task.update"
  | "task.update_status_own"
  | "task.delete"
  | "notification.read"
  | "notification.create"
  | "officer.assign_president";

/**
 * Qualifier set for one matrix row, keyed by the standard application roles.
 *
 * `DEV` is a bootstrap recovery account and is pinned to `"yes"` for every row.
 */
interface RoleCells {
  admin: AccessLevel;
  officer: AccessLevel;
  student: AccessLevel;
}

/**
 * Builds a matrix row for the standard roles, pinning `DEV` to allowed.
 *
 * @param cells - Access level per standard role for the row.
 * @returns A full `Role` → {@link AccessLevel} row for the matrix.
 */
const cells = ({ admin, officer, student }: RoleCells): Record<Role, AccessLevel> => ({
  DEV: "yes",
  ADMIN: admin,
  OFFICER: officer,
  STUDENT: student,
});

/**
 * The RBAC matrix, transcribed cell-for-cell from `documentation/RBAC.md`.
 * Edit a cell here and in the doc together.
 */
export const PERMISSION_MATRIX: Record<Permission, Record<Role, AccessLevel>> = {
  "user.read": cells({ admin: "yes", officer: "no", student: "no" }),
  "user.create": cells({ admin: "yes", officer: "no", student: "no" }),
  "user.update": cells({ admin: "yes", officer: "no", student: "no" }),
  "user.delete": cells({ admin: "yes", officer: "no", student: "no" }),

  "event.read_published": cells({ admin: "yes", officer: "yes", student: "yes" }),
  "event.read_all": cells({ admin: "yes", officer: "yes", student: "no" }),
  "event.create": cells({ admin: "yes", officer: "no", student: "no" }),
  "event.edit": cells({ admin: "yes", officer: "no", student: "no" }),
  "event.submit": cells({ admin: "yes", officer: "no", student: "no" }),
  "event.approve": cells({ admin: "yes", officer: "no", student: "no" }),
  "event.cancel": cells({ admin: "yes", officer: "no", student: "no" }),

  "registration.create": cells({ admin: "no", officer: "no", student: "yes" }),
  "registration.cancel": cells({ admin: "no", officer: "no", student: "yes" }),
  "registration.read_own": cells({ admin: "no", officer: "no", student: "yes" }),
  "registration.read_event": cells({ admin: "yes", officer: "yes", student: "no" }),

  "attendance.scan": cells({ admin: "yes", officer: "yes", student: "no" }),
  "attendance.manual": cells({ admin: "yes", officer: "yes", student: "no" }),
  "attendance.view": cells({ admin: "yes", officer: "yes", student: "no" }),

  "task.create": cells({ admin: "yes", officer: "no", student: "no" }),
  "task.read_own": cells({ admin: "yes", officer: "yes", student: "no" }),
  "task.read_assigned": cells({ admin: "yes", officer: "no", student: "no" }),
  "task.read_all": cells({ admin: "yes", officer: "no", student: "no" }),
  "task.update": cells({ admin: "yes", officer: "no", student: "no" }),
  "task.update_status_own": cells({ admin: "yes", officer: "yes", student: "no" }),
  "task.delete": cells({ admin: "yes", officer: "no", student: "no" }),

  "notification.read": cells({ admin: "yes", officer: "yes", student: "yes" }),
  "notification.create": cells({ admin: "yes", officer: "yes", student: "no" }),

  "officer.assign_president": cells({ admin: "yes", officer: "no", student: "no" }),
};

/**
 * Permissions granted to an officer by their position.
 *
 * `null` is a plain officer. `PRESIDENT` adds event lifecycle and task
 * assignment. The scan/manual matrix cells are only a coarse gate; the event
 * guard still decides whether an officer may scan a particular event.
 */
const PLAIN_OFFICER_PERMISSIONS: readonly Permission[] = [
  "event.read_published",
  "event.read_all",
  "registration.read_event",
  "attendance.scan",
  "attendance.manual",
  "attendance.view",
  "task.read_own",
  "task.update_status_own",
  "notification.read",
  "notification.create",
];

const PRESIDENT_PERMISSIONS: readonly Permission[] = [
  ...PLAIN_OFFICER_PERMISSIONS,
  "event.create",
  "event.edit",
  "event.submit",
  "event.cancel",
  "task.create",
  "task.read_assigned",
  "task.update",
  "task.delete",
];

/**
 * Evaluates whether an officer position grants a permission.
 *
 * @param position - The officer position, or `null` for a plain officer.
 * @param permission - The granular action to evaluate.
 * @returns `true` when the position grants the permission.
 */
export function positionAllows(
  position: OfficerPosition | null | undefined,
  permission: Permission,
): boolean {
  const granted =
    position === OfficerPosition.PRESIDENT ? PRESIDENT_PERMISSIONS : PLAIN_OFFICER_PERMISSIONS;
  return granted.includes(permission);
}

/**
 * Evaluates whether a role may perform a permission.
 *
 * @param role - The user's role (nullable, as it comes from the session).
 * @param permission - The granular action to evaluate.
 * @returns `true` when the role is permitted.
 */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[permission]?.[role] === "yes";
}

/**
 * Evaluates a permission with both the role matrix and the officer position.
 *
 * Non-officers are evaluated on the role matrix alone. Officers are evaluated
 * on their position list, which is the finer-grained source of truth for the
 * Officer row (for example, only the President may create tasks).
 *
 * @param role - The user's role (nullable, as it comes from the session).
 * @param position - The officer position, or `null` for a plain officer.
 * @param permission - The granular action to evaluate.
 * @returns `true` when the role and position are permitted.
 */
export function canWithPosition(
  role: Role | null | undefined,
  position: OfficerPosition | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  if (role !== Role.OFFICER) return can(role, permission);
  return positionAllows(position, permission);
}
