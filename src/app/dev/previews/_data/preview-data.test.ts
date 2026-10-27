import { describe, expect, it } from "vitest";

import { initialEvents } from "@/features/events/initial-events";
import { NotificationAudience } from "@/generated/prisma/browser";

import { buildPreviewNotifications } from "./preview-notifications";

describe("preview fixtures", () => {
  it("keeps every notification campus-wide", () => {
    const notifications = buildPreviewNotifications();

    expect(
      notifications.every((notification) => notification.audience === NotificationAudience.ALL),
    ).toBe(true);
  });

  it("keeps the unread badge in sync with the notification rows", () => {
    const notifications = buildPreviewNotifications();

    expect(notifications.filter((notification) => !notification.isRead)).toHaveLength(4);
    expect(notifications[0]?.isRead).toBe(false);
  });

  it("links every notification event to a preview event", () => {
    const eventIds = new Set(initialEvents.map((event) => event.id));
    const notifications = buildPreviewNotifications();

    for (const notification of notifications) {
      if (notification.eventId) {
        expect(eventIds.has(notification.eventId)).toBe(true);
      }
    }
  });
});
