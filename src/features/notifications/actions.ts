"use server";

import type { PageQuery } from "@/lib/primitives/types";
import { actionInvalid, type ActionStatusResponse } from "@/lib/security/action-response";
import { requireAuth, requirePermission } from "@/lib/security/auth-guards";
import { toActionResponse } from "@/lib/security/errors";

import { createNotification, markAllNotificationsRead, markNotificationRead } from "./mutations";
import { getNotificationPage, getUnreadNotificationCount, type NotificationPage } from "./queries";
import {
  MarkNotificationReadSchema,
  NotificationPageQuerySchema,
  SendNotificationSchema,
  type MarkNotificationReadPayload,
  type SendNotificationPayload,
} from "./schemas";
import { buildNotificationScope } from "./scope";

/**
 * Reads a cursor page of campus-wide notifications visible to the signed-in user.
 *
 * @param query - Search, sort, filter, cursor, and page-size parameters.
 * @returns A cursor page of notification rows.
 * @throws When the caller lacks `notification.read`.
 */
export async function getNotificationPageAction(query: PageQuery): Promise<NotificationPage> {
  const session = await requirePermission("notification.read");
  const parsed = NotificationPageQuerySchema.safeParse(query);
  return getNotificationPage({
    scope: buildNotificationScope(session),
    query: parsed.success ? parsed.data : {},
  });
}

/**
 * Counts unread campus-wide notifications for the signed-in user.
 *
 * @returns The unread notification count.
 * @throws When the caller lacks `notification.read`.
 */
export async function getUnreadNotificationCountAction(): Promise<number> {
  const session = await requirePermission("notification.read");
  return getUnreadNotificationCount(buildNotificationScope(session));
}

/**
 * Marks a single notification as read for the signed-in user.
 *
 * @param payload - The `notificationId` to mark read.
 * @returns `success: true`, or an invalid envelope.
 * @throws {UnauthorizedError} When the caller has no session.
 */
export async function markNotificationReadAction(
  payload: MarkNotificationReadPayload,
): Promise<ActionStatusResponse> {
  try {
    const session = await requireAuth();
    const parsed = MarkNotificationReadSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("notification");
    await markNotificationRead(parsed.data.notificationId, session.id);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "mark notification as read");
  }
}

/**
 * Marks every campus-wide notification as read for the signed-in user.
 *
 * @returns `success: true`, or a sanitized error envelope.
 * @throws {ForbiddenError} When the caller lacks `notification.read`.
 */
export async function markAllNotificationsReadAction(): Promise<ActionStatusResponse> {
  try {
    const session = await requirePermission("notification.read");
    await markAllNotificationsRead(buildNotificationScope(session));
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "mark all notifications as read");
  }
}

/**
 * Creates a campus-wide in-app notification.
 *
 * @param payload - Title and body.
 * @returns `success: true`, or an invalid envelope.
 * @throws {ForbiddenError} When the caller lacks `notification.create`.
 */
export async function sendNotificationAction(
  payload: SendNotificationPayload,
): Promise<ActionStatusResponse> {
  try {
    const session = await requirePermission("notification.create");
    const parsed = SendNotificationSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("notification");
    await createNotification({ ...parsed.data, createdById: session.id });
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "send notification");
  }
}
