"use client";

import clsx from "clsx";
import { FaBullhorn } from "react-icons/fa6";

import { timeAgo } from "@/lib/primitives/date";

import type { NotificationRow } from "../../queries";
import styles from "./NotificationCard.module.css";

interface NotificationCardProps {
  notification: NotificationRow;
  isSelected: boolean;
  onSelect: (notification: NotificationRow) => void;
}

export function NotificationCard({ notification, isSelected, onSelect }: NotificationCardProps) {
  return (
    <button
      type="button"
      className={clsx(styles.card, !notification.isRead && styles.unread)}
      aria-current={isSelected ? "true" : undefined}
      onClick={() => onSelect(notification)}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.header}>
          <span className={styles.title}>{notification.title}</span>
          <time
            className={styles.time}
            dateTime={notification.createdAt.toISOString()}
            suppressHydrationWarning
          >
            {timeAgo(notification.createdAt)}
          </time>
        </span>
        <span className={styles.body}>{notification.body}</span>
        <span className={styles.tags}>
          <span className={styles.chip}>
            <FaBullhorn aria-hidden="true" />
            Campus-wide
          </span>
        </span>
      </span>
      {!notification.isRead && <span className={styles.srOnly}>Unread</span>}
    </button>
  );
}
