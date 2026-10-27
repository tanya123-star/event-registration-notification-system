"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowLeft,
  FaCalendarDay,
  FaCalendarPlus,
  FaCalendarXmark,
  FaClock,
  FaLocationDot,
  FaUserGroup,
} from "react-icons/fa6";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { Link } from "@/components/ui/Link/Link";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";

import { cancelRegistrationAction, registerForEventAction } from "../../actions";
import { formatEventDay, formatEventTimeRange, formatLongDateTime } from "../../format";
import type { EventView } from "../../types";
import { EventStatusPill } from "../EventStatusPill/EventStatusPill";
import { RegistrationModal } from "../RegistrationModal/RegistrationModal";
import { SeatAvailabilityCard } from "../SeatAvailabilityCard/SeatAvailabilityCard";
import styles from "./EventDetailView.module.css";

interface EventDetailViewProps {
  event: EventView;
  canRegister?: boolean;
}

interface InfoItemProps {
  icon: IconType;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoIcon} aria-hidden="true">
        <Icon />
      </span>
      <div className={styles.infoText}>
        <dt className={styles.infoLabel}>{label}</dt>
        <dd className={styles.infoValue}>{value}</dd>
      </div>
    </div>
  );
}

export function EventDetailView({ event, canRegister = true }: EventDetailViewProps) {
  const router = useRouter();
  const [reference, setReference] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const registration = event.registration?.state === "registered" ? event.registration : null;

  async function handleRegister() {
    const result = await registerForEventAction({ eventId: event.id });
    setIsRegisterOpen(false);

    if (!result.success || !result.data) {
      toastActionError(result, "register for event");
      return;
    }

    setReference(result.data.reference);
    setIsSuccessOpen(true);
    router.refresh();
  }

  async function handleCancel() {
    const result = await cancelRegistrationAction({ eventId: event.id });
    setIsCancelOpen(false);
    setIsDetailsOpen(false);

    if (!result.success) {
      toastActionError(result, "cancel registration");
      return;
    }

    toastSuccess(
      "Registration cancelled",
      "Your seat has been released. You can register again before the event starts.",
    );
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <Link href="/events" variant="unstyled" className={styles.backLink}>
        <FaArrowLeft aria-hidden="true" />
        Back to events
      </Link>

      <div className={styles.layout}>
        <article className={styles.mainCard}>
          <header className={styles.eventHeader}>
            <h1 className={styles.eventTitle}>{event.title}</h1>
            <div className={styles.tags}>
              <EventStatusPill status={event.status} />
            </div>
          </header>

          <section className={styles.about} aria-labelledby="about-event-heading">
            <h2 id="about-event-heading" className={styles.sectionTitle}>
              About this event
            </h2>
            <p className={styles.aboutText}>{event.description}</p>
          </section>

          <dl className={styles.infoGrid}>
            <InfoItem icon={FaCalendarDay} label="Date" value={formatEventDay(event.startAt)} />
            <InfoItem
              icon={FaClock}
              label="Time"
              value={formatEventTimeRange(event.startAt, event.endAt)}
            />
            <InfoItem icon={FaLocationDot} label="Venue" value={event.venue} />
            <InfoItem icon={FaUserGroup} label="Organizer" value={event.organizer} />
            <InfoItem
              icon={FaCalendarPlus}
              label="Registration opens"
              value={formatLongDateTime(event.registrationOpensAt)}
            />
            <InfoItem
              icon={FaCalendarXmark}
              label="Registration closes"
              value={formatLongDateTime(event.registrationClosesAt)}
            />
          </dl>
        </article>

        <aside className={styles.sidebar} aria-label="Registration">
          <SeatAvailabilityCard
            event={event}
            canRegister={canRegister}
            onRegister={() => setIsRegisterOpen(true)}
            onManageRegistration={() => setIsDetailsOpen(true)}
          />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        title="Register for this event?"
        confirmLabel="Yes, register"
        cancelLabel="Keep browsing"
        onConfirm={() => void handleRegister()}
      >
        Your seat will be reserved and you&apos;ll get a registration reference.
      </ConfirmDialog>

      {registration && (
        <RegistrationModal
          mode="manage"
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          reference={registration.reference}
          canCancel={event.canCancel}
          onCancel={() => setIsCancelOpen(true)}
        />
      )}

      {reference && (
        <RegistrationModal
          mode="success"
          isOpen={isSuccessOpen}
          onOpenChange={setIsSuccessOpen}
          reference={reference}
        />
      )}

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
