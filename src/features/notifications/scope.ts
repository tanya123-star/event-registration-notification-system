import { NotificationAudience } from "@/generated/prisma/browser";
import type { Prisma } from "@/generated/prisma/client";

export interface NotificationScope {
  userId: string;
}

export interface NotificationScopeUser {
  id: string;
}

export function buildNotificationScope(user: NotificationScopeUser): NotificationScope {
  return { userId: user.id };
}

/**
 * Builds the Prisma audience filter for campus-wide notifications.
 *
 * Legacy club-scoped rows stay in the database but are hidden from every feed.
 *
 * @returns A where-input matching only campus-wide notifications.
 */
export function buildNotificationAudienceFilter(): Prisma.NotificationWhereInput {
  return { audience: NotificationAudience.ALL };
}
