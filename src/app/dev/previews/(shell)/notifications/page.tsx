import { buildPreviewNotifications } from "@/app/dev/previews/_data/preview-notifications";
import { NotificationsFeed } from "@/features/notifications/components/NotificationsFeed/NotificationsFeed";
import { UnreadCountProvider } from "@/features/notifications/unread-count-context";

export default function NotificationsPreviewPage() {
  const notifications = buildPreviewNotifications();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <UnreadCountProvider initialCount={unreadCount}>
      <NotificationsFeed initialNotifications={notifications} initialCursor={null} canCompose />
    </UnreadCountProvider>
  );
}
