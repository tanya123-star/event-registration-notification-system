"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaCalendarDay,
  FaCircleInfo,
  FaClock,
  FaLocationDot,
  FaTriangleExclamation,
} from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";

import { cancelRegistrationAction } from "../../actions";
import { formatEventDay, formatEventTimeRange } from "../../format";
import type { EventView } from "../../types";
import { EventStatusPill } from "../EventStatusPill/EventStatusPill";
import { RegistrationDetails } from "../RegistrationDetails/RegistrationDetails";
import styles from "./EventTicket.module.css";

interface EventTicketProps {
  event: EventView;
  reference: string;
  attendeeName: string;
  attendeeEmail: string;
}

const checkInSteps = [
  { title: "Arrive at the venue", text: "Keep this ticket open on your phone." },
  { title: "Show your QR code", text: "A KASAMA officer scans it." },
  { title: "You are marked present", text: "Your attendance appears in My Attendance right away." },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EventTicket({ event, reference, attendeeName, attendeeEmail }: EventTicketProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    const result = await cancelRegistrationAction({ eventId: event.id });
    setIsCancelOpen(false);

    if (!result.success) {
      toastActionError(result, "cancel registration");
      return;
    }

    toastSuccess(
      "Registration cancelled",
      "Your seat has been released. Your confirmation reference is kept.",
    );
    router.push("/registrations");
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <ButtonLink variant="secondary" href="/registrations">
          Back to My Registrations
        </ButtonLink>
      </div>
      <h1 className={styles.srOnly}>Event ticket</h1>

      <div className={styles.layout}>
        <article className={styles.ticket}>
          <header className={styles.ticketHeader}>
            <span className={styles.admitLabel}>Admit one</span>
            <h2 className={styles.eventTitle}>{event.title}</h2>
            <p className={styles.organizer}>{event.organizer}</p>
          </header>

          <div className={styles.ticketBody}>
            <RegistrationDetails
              reference={reference}
              note="Show this code to an officer at the venue."
            />

            <dl className={styles.meta}>
              <div className={styles.metaRow}>
                <dt className={styles.srOnly}>Date</dt>
                <dd>
                  <FaCalendarDay aria-hidden="true" className={styles.metaIcon} />
                  {formatEventDay(event.startAt)}
                </dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.srOnly}>Time</dt>
                <dd>
                  <FaClock aria-hidden="true" className={styles.metaIcon} />
                  {formatEventTimeRange(event.startAt, event.endAt)}
                </dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.srOnly}>Venue</dt>
                <dd>
                  <FaLocationDot aria-hidden="true" className={styles.metaIcon} />
                  {event.venue}
                </dd>
              </div>
            </dl>

            <div className={styles.attendee}>
              <span className={styles.avatar} aria-hidden="true">
                {getInitials(attendeeName)}
              </span>
              <div className={styles.attendeeText}>
                <span className={styles.attendeeName}>{attendeeName}</span>
                <span className={styles.attendeeEmail}>{attendeeEmail}</span>
              </div>
              <EventStatusPill status="registered" />
            </div>
          </div>
        </article>

        <div className={styles.side}>
          <section className={styles.helpCard} aria-labelledby="check-in-heading">
            <h2 id="check-in-heading" className={styles.helpTitle}>
              How check in works
            </h2>
            <ol className={styles.steps}>
              {checkInSteps.map((step) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepText}>{step.text}</span>
                </li>
              ))}
            </ol>
          </section>

          <p className={styles.infoNotice}>
            <FaCircleInfo aria-hidden="true" className={styles.noticeIcon} />
            Your confirmation reference stays the same if you cancel and register again.
          </p>

          <p className={styles.warningNotice}>
            <FaTriangleExclamation aria-hidden="true" className={styles.noticeIcon} />
            No QR code? Give your reference to an officer and they can check you in manually.
          </p>

          {event.canCancel && (
            <Button
              variant="secondary"
              className={styles.cancelButton}
              onPress={() => setIsCancelOpen(true)}
            >
              Cancel registration
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel your registration?"
        confirmLabel="Cancel registration"
        cancelLabel="Keep registration"
        onConfirm={() => void handleCancel()}
      >
        Your seat will be released. You can register again before the event starts.
      </ConfirmDialog>
    </div>
  );
}
