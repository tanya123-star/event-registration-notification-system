"use client";

import clsx from "clsx";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBell,
  FaCalendarCheck,
  FaCalendarDays,
  FaChevronRight,
  FaCopy,
  FaDoorOpen,
  FaQrcode,
} from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { Link } from "@/components/ui/Link/Link";
import { attendanceRecords, getAttendanceSummary } from "@/features/events/attendance-data";
import { EventCard } from "@/features/events/components/EventCard/EventCard";
import { EventStatusPill } from "@/features/events/components/EventStatusPill/EventStatusPill";
import { formatEventTimeRange, formatEventWeekdayShort } from "@/features/events/format";
import { getRegistrationGroups } from "@/features/events/registrations";
import type { EventView } from "@/features/events/types";
import { useUnreadCount } from "@/features/notifications/unread-count-context";
import { toastError, toastSuccess } from "@/lib/hooks/toast-utils";
import { formatMonthDay, timeAgo } from "@/lib/primitives/date";

import styles from "./StudentDashboard.module.css";

const PREVIEW_LIMIT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardNotification {
  id: string;
  title: string;
  createdAt: Date;
}

interface StudentDashboardProps {
  greeting: string;
  userName: string | null;
  notifications: DashboardNotification[];
  events: EventView[];
}

interface DashboardStat {
  id: "registered" | "open" | "attended" | "unread";
  label: string;
  hint: string;
  value: number;
  href: string;
  icon: IconType;
  tone: "sky" | "success" | "warning" | "danger";
}

function getDaysUntil(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS));
}

function copyReference(reference: string) {
  void navigator.clipboard.writeText(reference).then(
    () => toastSuccess("Reference copied", "Your confirmation reference is on the clipboard."),
    () => toastError("Failed to copy reference", "Select the reference and copy it manually."),
  );
}

export function StudentDashboard({
  greeting,
  userName,
  notifications,
  events,
}: StudentDashboardProps) {
  const { count: unreadCount } = useUnreadCount();
  const attendance = getAttendanceSummary(attendanceRecords);
  const groups = getRegistrationGroups(events);

  const openEvents = events
    .filter((event) => event.status === "open")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, PREVIEW_LIMIT);

  const nextEvent = groups.upcoming[0] ?? null;
  const nextReference = nextEvent?.registration?.reference ?? null;

  const firstName = userName?.split(" ")[0];
  const heroSummary = nextEvent
    ? `You have ${groups.upcoming.length} upcoming ${groups.upcoming.length === 1 ? "event" : "events"}. ${nextEvent.title} is in ${getDaysUntil(nextEvent.startAt)} days.`
    : "Nothing on your calendar yet. Browse events to find your next one.";

  const stats: DashboardStat[] = [
    {
      id: "registered",
      label: "Registered events",
      hint: nextEvent ? `Next in ${getDaysUntil(nextEvent.startAt)} days` : "Nothing scheduled yet",
      value: groups.upcoming.length,
      href: "/registrations",
      icon: FaCalendarDays,
      tone: "sky",
    },
    {
      id: "open",
      label: "Open for registration",
      hint: "Accepting sign-ups now",
      value: events.filter((event) => event.status === "open").length,
      href: "/events?status=open",
      icon: FaDoorOpen,
      tone: "success",
    },
    {
      id: "attended",
      label: "Events attended",
      hint: `${attendance.thisMonth} this month`,
      value: attendance.attended,
      href: "/attendance",
      icon: FaCalendarCheck,
      tone: "warning",
    },
    {
      id: "unread",
      label: "Unread notifications",
      hint: unreadCount === 0 ? "You are all caught up" : "Waiting in your inbox",
      value: unreadCount,
      href: "/notifications",
      icon: FaBell,
      tone: "danger",
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h2 className={styles.heroTitle}>
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h2>
          <p className={styles.heroText}>{heroSummary}</p>
        </div>
        <ButtonLink variant="secondary" href="/events" className={styles.heroAction}>
          Browse events
          <FaArrowRight aria-hidden="true" className={styles.heroActionIcon} />
        </ButtonLink>
      </section>

      <ul className={styles.stats}>
        {stats.map((stat) => (
          <li key={stat.id} className={styles.statCard}>
            <Link href={stat.href} variant="unstyled" className={styles.statCardLink}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={clsx(styles.statIcon, styles[stat.tone])} aria-hidden="true">
                  <stat.icon />
                </span>
              </div>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statHint}>{stat.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className={styles.panel} aria-labelledby="dashboard-registrations-title">
        <div className={styles.panelHeader}>
          <h2 id="dashboard-registrations-title" className={styles.panelTitle}>
            Upcoming registrations
          </h2>
          <Link href="/registrations" className={styles.panelLink}>
            View all
          </Link>
        </div>

        {groups.upcoming.length > 0 ? (
          <ul className={styles.rowList}>
            {groups.upcoming.slice(0, PREVIEW_LIMIT).map((event) => {
              const date = formatMonthDay(event.startAt);

              return (
                <li key={event.id}>
                  <Link
                    href={`/registrations/${event.id}/ticket`}
                    variant="unstyled"
                    className={styles.eventRow}
                  >
                    <span className={styles.dateTile} aria-hidden="true">
                      <span className={styles.month}>{date.month}</span>
                      <span className={styles.day}>{date.day}</span>
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.rowTitle}>{event.title}</span>
                      <span className={styles.rowMeta}>
                        {formatEventWeekdayShort(event.startAt)},{" "}
                        {formatEventTimeRange(event.startAt, event.endAt)} · {event.venue}
                      </span>
                    </span>
                    <EventStatusPill status="registered" className={styles.rowPill} />
                    <FaChevronRight aria-hidden="true" className={styles.rowChevron} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.empty}>
            No upcoming registrations. Browse events to reserve your seat.
          </p>
        )}
      </section>

      <div className={styles.rail}>
        <section className={styles.panel} aria-labelledby="dashboard-next-event-title">
          <div className={styles.panelHeader}>
            <h2 id="dashboard-next-event-title" className={styles.panelTitle}>
              Next event
            </h2>
          </div>

          {nextEvent ? (
            <div className={styles.nextEvent}>
              <div className={styles.nextEventTop}>
                <h3 className={styles.nextEventTitle}>{nextEvent.title}</h3>
                <span className={styles.countdown}>In {getDaysUntil(nextEvent.startAt)} days</span>
              </div>
              <p className={styles.nextEventMeta}>
                {formatEventWeekdayShort(nextEvent.startAt)},{" "}
                {formatEventTimeRange(nextEvent.startAt, nextEvent.endAt)}
              </p>
              <p className={styles.nextEventMeta}>{nextEvent.venue}</p>

              {nextReference ? (
                <>
                  <div className={styles.reference}>
                    <span className={styles.referenceLabel}>Confirmation reference</span>
                    <div className={styles.referenceRow}>
                      <code className={styles.referenceValue}>{nextReference}</code>
                      <Button
                        variant="ghost"
                        className={styles.copyButton}
                        aria-label="Copy confirmation reference"
                        onPress={() => copyReference(nextReference)}
                      >
                        <FaCopy aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <ButtonLink
                    variant="secondary"
                    href={`/registrations/${nextEvent.id}/ticket`}
                    className={styles.ticketButton}
                  >
                    <FaQrcode aria-hidden="true" className={styles.ticketIcon} />
                    View QR code
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink
                  variant="primary"
                  href={`/events/${nextEvent.id}`}
                  className={styles.ticketButton}
                >
                  View event
                </ButtonLink>
              )}
            </div>
          ) : (
            <p className={styles.empty}>No upcoming events right now.</p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="dashboard-notifications-title">
          <div className={styles.panelHeader}>
            <h2 id="dashboard-notifications-title" className={styles.panelTitle}>
              Recent notifications
            </h2>
            <Link href="/notifications" className={styles.panelLink}>
              See all
            </Link>
          </div>

          {notifications.length > 0 ? (
            <ul className={styles.rowList}>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link href="/notifications" variant="unstyled" className={styles.notificationRow}>
                    <span className={styles.notificationDot} aria-hidden="true" />
                    <span className={styles.rowBody}>
                      <span className={styles.notificationTitle}>{notification.title}</span>
                      <span className={styles.rowMeta}>{timeAgo(notification.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>You are all caught up.</p>
          )}
        </section>
      </div>

      {openEvents.length > 0 && (
        <section className={styles.openSection} aria-labelledby="dashboard-open-title">
          <div className={styles.panelHeader}>
            <h2 id="dashboard-open-title" className={styles.panelTitle}>
              Open for registration
            </h2>
            <Link href="/events" className={styles.panelLink}>
              Browse all events
            </Link>
          </div>
          <div className={styles.openGrid}>
            {openEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
