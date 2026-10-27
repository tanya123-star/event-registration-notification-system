import { NotificationAudience, type Notification } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

import { buildNotificationAudienceFilter, type NotificationScope } from "./scope";

export interface NotificationCreatePayload {
  title: string;
  body: string;
  createdById: string;
}

export async function createNotification(
  payload: NotificationCreatePayload,
): Promise<Notification> {
  return prisma.notification.create({
    data: { ...payload, audience: NotificationAudience.ALL, clubId: null },
  });
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId, userId } },
    update: { readAt: new Date() },
    create: { notificationId, userId },
  });
}

export async function markAllNotificationsRead(scope: NotificationScope): Promise<void> {
  const unread = await prisma.notification.findMany({
    where: {
      ...buildNotificationAudienceFilter(),
      reads: { none: { userId: scope.userId } },
    },
    select: { id: true },
  });
  if (unread.length === 0) return;

  await prisma.notificationRead.createMany({
    data: unread.map((notification) => ({
      notificationId: notification.id,
      userId: scope.userId,
    })),
    skipDuplicates: true,
  });
}
