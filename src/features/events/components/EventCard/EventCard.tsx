import clsx from "clsx";
import { FaClock, FaLocationDot, FaUsers } from "react-icons/fa6";

import { Link } from "@/components/ui/Link/Link";
import { formatMonthDay } from "@/lib/primitives/date";

import { formatEventDay, formatEventTimeRange } from "../../format";
import type { EventView } from "../../types";
import { EventStatusPill } from "../EventStatusPill/EventStatusPill";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: EventView;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const date = formatMonthDay(event.startAt);
  const seatAvailability =
    event.remainingSeats === null
      ? "No seat limit"
      : event.remainingSeats > 0
        ? `${event.remainingSeats} seats left`
        : "No seats left";

  return (
    <Link
      href={`/events/${event.id}`}
      variant="unstyled"
      className={clsx(styles.card, className)}
      aria-label={`${event.title}, ${formatEventDay(event.startAt)}`}
    >
      <div className={styles.topRow}>
        <div className={styles.dateTile} aria-hidden="true">
          <span className={styles.month}>{date.month}</span>
          <span className={styles.day}>{date.day}</span>
        </div>
        <div className={styles.heading}>
          <h3 className={styles.title}>{event.title}</h3>
          <span className={styles.organizer}>{event.organizer}</span>
        </div>
        <EventStatusPill status={event.status} className={styles.status} />
      </div>
      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <FaClock aria-hidden="true" className={styles.metaIcon} />
          <time dateTime={event.startAt}>{formatEventTimeRange(event.startAt, event.endAt)}</time>
        </span>
        <span className={styles.metaItem}>
          <FaLocationDot aria-hidden="true" className={styles.metaIcon} />
          {event.venue}
        </span>
        <span className={styles.metaItem}>
          <FaUsers aria-hidden="true" className={styles.metaIcon} />
          {seatAvailability}
        </span>
      </div>
    </Link>
  );
}
