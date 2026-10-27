"use client";

import clsx from "clsx";

import { Button } from "@/components/ui/Button/Button";

import { formatLongDateTime } from "../../format";
import type { EventView } from "../../types";
import styles from "./SeatAvailabilityCard.module.css";

interface SeatAvailabilityCardProps {
  event: EventView;
  onRegister: () => void;
  onManageRegistration: () => void;
  canRegister?: boolean;
  className?: string;
}

const disabledMessages = {
  full: "This event is full. No seats are currently available.",
  closed: "Registration is closed for this event.",
} as const;

const reasonId = "seat-availability-reason";

export function SeatAvailabilityCard({
  event,
  onRegister,
  onManageRegistration,
  canRegister = true,
  className,
}: SeatAvailabilityCardProps) {
  const isRegistered = event.status === "registered";
  const disabledMessage =
    event.status === "full" || event.status === "closed" ? disabledMessages[event.status] : null;

  return (
    <section className={clsx(styles.card, className)} aria-labelledby="seat-availability-heading">
      <h2 id="seat-availability-heading" className={styles.heading}>
        Seat availability
      </h2>

      <p className={styles.taken}>
        <strong className={styles.takenValue}>{event.seatsTaken}</strong>
        <span className={styles.takenLabel}>
          {event.capacity === null
            ? "seats taken (no capacity limit)"
            : `of ${event.capacity} seats taken`}
        </span>
      </p>

      {event.capacity !== null && (
        <progress
          className={styles.progress}
          value={event.seatsTaken}
          max={event.capacity}
          aria-label="Seats taken"
        />
      )}

      <p className={styles.remaining} aria-live="polite">
        {event.remainingSeats === null ? (
          <strong>No seat limit</strong>
        ) : (
          <>
            <strong>{event.remainingSeats}</strong> {event.remainingSeats === 1 ? "seat" : "seats"}{" "}
            remaining
          </>
        )}
      </p>

      <div className={styles.deadline}>
        <span className={styles.deadlineLabel}>Registration closes</span>
        <span>{formatLongDateTime(event.registrationClosesAt)}</span>
      </div>

      <Button
        variant="primary"
        className={styles.registerButton}
        isDisabled={disabledMessage !== null}
        aria-describedby={disabledMessage ? reasonId : undefined}
        aria-label={isRegistered ? "You're registered. View registration details" : undefined}
        onPress={isRegistered ? onManageRegistration : onRegister}
        hidden={!canRegister}
      >
        {isRegistered ? "You're registered" : "Register"}
      </Button>

      {canRegister && disabledMessage && (
        <p id={reasonId} className={styles.reason}>
          {disabledMessage}
        </p>
      )}

      {canRegister && (
        <p className={styles.note}>
          You can cancel your registration any time before the event starts.
        </p>
      )}
    </section>
  );
}
