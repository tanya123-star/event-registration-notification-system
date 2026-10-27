"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";

import { cancelRegistrationAction } from "../../actions";
import { formatEventDateMedium } from "../../format";
import { getRegistrationGroups, type RegistrationTab } from "../../registrations";
import type { EventView } from "../../types";
import { EventStatusPill } from "../EventStatusPill/EventStatusPill";
import styles from "./MyRegistrations.module.css";

interface MyRegistrationsProps {
  events: EventView[];
}

const tabs: { id: RegistrationTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

const emptyStates: Record<RegistrationTab, { title: string; text: string }> = {
  upcoming: {
    title: "No upcoming registrations",
    text: "Browse events to reserve your seat at the next one.",
  },
  past: {
    title: "No past registrations",
    text: "Events you were registered for appear here after they start.",
  },
  cancelled: {
    title: "No cancelled registrations",
    text: "Registrations you cancel are kept here with their reference.",
  },
};

export function MyRegistrations({ events }: MyRegistrationsProps) {
  const router = useRouter();
  const groups = getRegistrationGroups(events);
  const [activeTab, setActiveTab] = useState<RegistrationTab>("upcoming");
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  const rows = groups[activeTab];
  const emptyState = emptyStates[activeTab];

  async function handleCancel() {
    if (!pendingCancelId) return;

    const result = await cancelRegistrationAction({ eventId: pendingCancelId });
    setPendingCancelId(null);

    if (!result.success) {
      toastActionError(result, "cancel registration");
      return;
    }

    toastSuccess(
      "Registration cancelled",
      "Your seat has been released. Your confirmation reference is kept.",
    );
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label="Filter registrations">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={styles.tab}
                data-active={isActive}
                aria-pressed={isActive}
                onPress={() => setActiveTab(tab.id)}
              >
                {tab.label} ({groups[tab.id].length})
              </Button>
            );
          })}
        </div>
        <ButtonLink variant="secondary" href="/events" className={styles.browse}>
          Browse events
        </ButtonLink>
      </div>

      {rows.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Date</th>
                <th scope="col">Confirmation reference</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id}>
                  <td>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventOrganizer}>{event.organizer}</span>
                  </td>
                  <td className={styles.date}>{formatEventDateMedium(event.startAt)}</td>
                  <td>
                    <code className={styles.reference}>{event.registration?.reference}</code>
                  </td>
                  <td>
                    {activeTab === "cancelled" ? (
                      <span className={styles.cancelledPill}>Cancelled</span>
                    ) : (
                      <EventStatusPill status="registered" />
                    )}
                  </td>
                  <td>
                    {activeTab === "cancelled" ? null : (
                      <div className={styles.actions}>
                        <ButtonLink
                          variant="primary"
                          href={`/registrations/${event.id}/ticket`}
                          aria-label={`View ticket for ${event.title}`}
                        >
                          View ticket
                        </ButtonLink>
                        {event.canCancel && (
                          <Button
                            variant="secondary"
                            aria-label={`Cancel registration for ${event.title}`}
                            onPress={() => setPendingCancelId(event.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>{emptyState.title}</p>
          <p className={styles.emptyText}>{emptyState.text}</p>
        </div>
      )}

      {rows.length > 0 && (
        <p className={styles.footnote}>
          Cancelling a registration releases your seat. Your confirmation reference is kept if you
          register again.
        </p>
      )}

      <ConfirmDialog
        isOpen={pendingCancelId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPendingCancelId(null);
        }}
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
