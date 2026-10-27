import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import {
  decodeTimestampCursor,
  encodeTimestampCursor,
  resolveCursorPageSize,
  type CursorPage,
  type TimestampCursor,
} from "@/lib/domain/pagination";
import { prisma } from "@/lib/infra/prisma";

export interface UserManagementRow {
  kind: "user" | "pending";
  id: string;
  name: string | null;
  email: string;
  role: Role;
  officerPosition: OfficerPosition | null;
  isActive: boolean | null;
  createdAt: Date;
}

export type UserManagementPage = CursorPage<UserManagementRow>;

export type UserStatusFilter = "active" | "inactive" | "pending";

export interface UserManagementPageQuery {
  search?: string;
  cursor?: string;
  pageSize?: number;
  role?: Role[];
  status?: UserStatusFilter[];
}

function buildUserCursorFilter(cursor: TimestampCursor | null): Prisma.UserWhereInput {
  if (!cursor) return {};
  return {
    OR: [
      { createdAt: { lt: cursor.timestamp } },
      { createdAt: cursor.timestamp, id: { lt: cursor.id } },
    ],
  };
}

function buildPendingCursorFilter(
  cursor: TimestampCursor | null,
): Prisma.PendingRoleAssignmentWhereInput {
  if (!cursor) return {};
  return {
    OR: [
      { assignedAt: { lt: cursor.timestamp } },
      { assignedAt: cursor.timestamp, id: { lt: cursor.id } },
    ],
  };
}

function compareRowsDescending(left: UserManagementRow, right: UserManagementRow): number {
  const byCreatedAt = right.createdAt.getTime() - left.createdAt.getTime();
  if (byCreatedAt !== 0) return byCreatedAt;
  if (left.id === right.id) return 0;
  return left.id < right.id ? 1 : -1;
}

function buildUserSearchFilter(search: string): Prisma.UserWhereInput {
  return search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
}

function buildPendingSearchFilter(search: string): Prisma.PendingRoleAssignmentWhereInput {
  return search ? { email: { contains: search, mode: "insensitive" } } : {};
}

export async function getUserManagementPage(
  query: UserManagementPageQuery = {},
): Promise<UserManagementPage> {
  const { search = "", cursor: rawCursor, pageSize, role = [], status = [] } = query;
  const resolvedPageSize = resolveCursorPageSize(pageSize);
  const take = resolvedPageSize + 1;
  const cursor = decodeTimestampCursor(rawCursor);
  const normalizedSearch = search.trim();
  const wantsActive = status.includes("active");
  const wantsInactive = status.includes("inactive");
  const wantsPending = status.includes("pending");
  const hasStatusFilter = status.length > 0;
  const includeUsers = !hasStatusFilter || wantsActive || wantsInactive;
  const includePending = !hasStatusFilter || wantsPending;

  const [users, pending] = await Promise.all([
    includeUsers
      ? prisma.user.findMany({
          where: {
            ...buildUserSearchFilter(normalizedSearch),
            ...(role.length > 0 ? { role: { in: role } } : {}),
            ...(wantsActive !== wantsInactive ? { isActive: wantsActive } : {}),
            ...buildUserCursorFilter(cursor),
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            officerPosition: true,
            isActive: true,
            createdAt: true,
          },
        })
      : [],
    includePending
      ? prisma.pendingRoleAssignment.findMany({
          where: {
            ...buildPendingSearchFilter(normalizedSearch),
            ...(role.length > 0 ? { role: { in: role } } : {}),
            ...buildPendingCursorFilter(cursor),
          },
          orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
          take,
          select: {
            id: true,
            email: true,
            role: true,
            officerPosition: true,
            assignedAt: true,
          },
        })
      : [],
  ]);

  const merged = [
    ...users.map((user) => ({
      kind: "user" as const,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      officerPosition: user.officerPosition,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })),
    ...pending.map((assignment) => ({
      kind: "pending" as const,
      id: assignment.id,
      name: null,
      email: assignment.email,
      role: assignment.role,
      officerPosition: assignment.officerPosition,
      isActive: null,
      createdAt: assignment.assignedAt,
    })),
  ].sort(compareRowsDescending);

  const hasMore = merged.length > resolvedPageSize;
  const page = hasMore ? merged.slice(0, resolvedPageSize) : merged;
  const last = page.at(-1);

  return {
    rows: page,
    nextCursor:
      hasMore && last ? encodeTimestampCursor({ timestamp: last.createdAt, id: last.id }) : null,
  };
}

export interface UserAuthorization {
  id: string;
  role: Role;
  officerPosition: OfficerPosition | null;
  isActive: boolean | null;
}

export async function getUserById(userId: string): Promise<UserAuthorization | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      officerPosition: true,
      isActive: true,
    },
  });
}

export interface PresidentSummary {
  id: string;
  name: string;
  email: string;
}

export async function getPresident(): Promise<PresidentSummary | null> {
  return prisma.user.findFirst({
    where: {
      role: Role.OFFICER,
      officerPosition: OfficerPosition.PRESIDENT,
      isActive: true,
    },
    select: { id: true, name: true, email: true },
  });
}

export async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      isActive: true,
      role: Role.ADMIN,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

export async function countActiveUsersByRole(role: Role): Promise<number> {
  return prisma.user.count({
    where: {
      isActive: true,
      role,
    },
  });
}

export async function countPendingRoleAssignments(): Promise<number> {
  return prisma.pendingRoleAssignment.count();
}
