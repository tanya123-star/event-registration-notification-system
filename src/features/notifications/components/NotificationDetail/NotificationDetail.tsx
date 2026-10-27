"use client";

import { FaArrowLeft, FaCalendarDay } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { formatDateTime, formatMonthDay } from "@/lib/primitives/date";

import type { NotificationRow } from "../../queries";
import styles from "./NotificationDetail.module.css";

interface NotificationDetailProps {
  notification: NotificationRow;
  onBack: () => void;
}

export function NotificationDetail({ notification, onBack }: NotificationDetailProps) {
  const eventDate = notification.eventStartAt ? formatMonthDay(notification.eventStartAt) : null;

  return (
    <aside className={styles.detail} aria-label="Notification details">
      <Button variant="ghost" className={styles.backButton} onPress={onBack}>
        <FaArrowLeft aria-hidden="true" />
        All notifications
      </Button>

      <div className={styles.meta}>
        <span className={styles.audience}>Campus-wide</span>
        <time className={styles.time} dateTime={notification.createdAt.toISOString()}>
          {formatDateTime(notification.createdAt)}
        </time>
      </div>

      <h2 className={styles.title}>{notification.title}</h2>
      <p className={styles.body}>{notification.body}</p>

      {notification.eventId && notification.eventTitle && (
        <div className={styles.eventSection}>
          <p className={styles.eventLabel}>Linked event</p>
          <div className={styles.eventCard}>
            <div className={styles.eventHeader}>
              {eventDate && (
                <span className={styles.dateTile} aria-hidden="true">
                  <span className={styles.dateMonth}>{eventDate.month}</span>
                  <span className={styles.dateDay}>{eventDate.day}</span>
                </span>
              )}
              <div className={styles.eventInfo}>
                <p className={styles.eventTitle}>{notification.eventTitle}</p>
                {notification.eventVenue && (
                  <span className={styles.eventVenue}>
                    <FaCalendarDay aria-hidden="true" />
                    {notification.eventVenue}
                  </span>
                )}
              </div>
            </div>
            <ButtonLink
              variant="primary"
              href={`/events/${notification.eventId}`}
              className={styles.eventLink}
            >
              View event
            </ButtonLink>
          </div>
        </div>
      )}
    </aside>
  );
}
