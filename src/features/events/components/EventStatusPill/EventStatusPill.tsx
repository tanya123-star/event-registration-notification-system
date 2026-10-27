import clsx from "clsx";

import type { EventStatus } from "../../types";
import styles from "./EventStatusPill.module.css";

interface EventStatusPillProps {
  status: EventStatus;
  className?: string;
}

const labels: Record<EventStatus, string> = {
  open: "Open",
  registered: "Registered",
  full: "Full",
  closed: "Registration closed",
};

export function EventStatusPill({ status, className }: EventStatusPillProps) {
  return <span className={clsx(styles.pill, styles[status], className)}>{labels[status]}</span>;
}
