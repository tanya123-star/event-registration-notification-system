"use client";

import { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ProgressCircle } from "@/components/ui/ProgressCircle/ProgressCircle";
import {
  getNotificationPageAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { NotificationCard } from "@/features/notifications/components/NotificationCard/NotificationCard";
import { NotificationDetail } from "@/features/notifications/components/NotificationDetail/NotificationDetail";
import { SendNotificationModal } from "@/features/notifications/components/SendNotificationModal/SendNotificationModal";
import type { NotificationRow } from "@/features/notifications/queries";
import { useUnreadCount } from "@/features/notifications/unread-count-context";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";
import { useCursorPagination } from "@/lib/hooks/useCursorPagination";
import type { PageQuery } from "@/lib/primitives/types";

import styles from "./NotificationsFeed.module.css";

type NotificationTab = "all" | "unread";

interface NotificationsFeedProps {
  initialNotifications: NotificationRow[];
  initialCursor: string | null;
  canCompose: boolean;
}

const tabs: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

export function NotificationsFeed({
  initialNotifications,
  initialCursor,
  canCompose,
}: NotificationsFeedProps) {
  const [tab, setTab] = useState<NotificationTab>("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialNotifications[0]?.id ?? null);
  const { count, setCount, decrement } = useUnreadCount();

  const query: PageQuery = tab === "unread" ? { filters: { status: ["unread"] } } : {};

  const { items, setItems, hasMore, isInitialLoad, isLoadingMore, loadMore, refresh } =
    useCursorPagination({
      fetchPage: getNotificationPageAction,
      query,
      initialRows: initialNotifications,
      initialCursor,
    });

  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  useEffect(() => {
    const root = listRef.current;
    const node = sentinelRef.current;
    if (!root || !node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, items.length]);

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const emptyMessage =
    tab === "unread"
      ? "You have no unread notifications."
      : "You do not have any notifications yet.";

  async function handleSelect(notification: NotificationRow) {
    setSelectedId(notification.id);
    setIsDetailOpen(true);
    if (notification.isRead) return;

    const response = await markNotificationReadAction({ notificationId: notification.id });
    if (!response.success) {
      toastActionError(response, "mark notification as read");
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );
    decrement();
  }

  async function handleMarkAllRead() {
    const response = await markAllNotificationsReadAction();
    if (!response.success) {
      toastActionError(response, "mark all notifications as read");
      return;
    }
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setCount(0);
    toastSuccess("All notifications marked as read", "You're all caught up.");
    if (tab === "unread") refresh();
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label="Filter notifications">
          {tabs.map((entry) => {
            const isActive = entry.id === tab;
            return (
              <Button
                key={entry.id}
                variant="ghost"
                className={styles.tab}
                data-active={isActive}
                aria-pressed={isActive}
                onPress={() => {
                  setTab(entry.id);
                  setIsDetailOpen(false);
                }}
              >
                {entry.id === "unread" && count > 0 ? `${entry.label} (${count})` : entry.label}
              </Button>
            );
          })}
        </div>

        <div className={styles.toolbarActions}>
          {canCompose && (
            <Button variant="secondary" onPress={() => setIsComposeOpen(true)}>
              <FaPlus aria-hidden="true" />
              Send notification
            </Button>
          )}
          <Button
            variant="ghost"
            className={styles.markAll}
            isDisabled={count === 0}
            onPress={() => void handleMarkAllRead()}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {isInitialLoad ? (
        <div className={styles.status}>
          <ProgressCircle aria-label="Loading notifications..." />
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div className={styles.layout} data-detail-open={isDetailOpen}>
          <div ref={listRef} className={styles.list}>
            {items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isSelected={notification.id === selected?.id}
                onSelect={(entry) => void handleSelect(entry)}
              />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className={styles.sentinel}>
                {isLoadingMore && <ProgressCircle aria-label="Loading more notifications..." />}
              </div>
            )}
            {!hasMore && <p className={styles.end}>You&apos;re all caught up.</p>}
          </div>

          {selected && (
            <div className={styles.detailPanel}>
              <NotificationDetail notification={selected} onBack={() => setIsDetailOpen(false)} />
            </div>
          )}
        </div>
      )}

      {canCompose && (
        <SendNotificationModal
          isOpen={isComposeOpen}
          onOpenChange={setIsComposeOpen}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
