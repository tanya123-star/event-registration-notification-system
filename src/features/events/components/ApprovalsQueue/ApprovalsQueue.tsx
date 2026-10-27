"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { DecisionModal } from "@/components/ui/DecisionModal/DecisionModal";
import { approveEventAction, requestEventRevisionAction } from "@/features/events/actions";
import type { ApprovalQueueRow } from "@/features/events/queries";
import { RequestEventRevisionSchema } from "@/features/events/schemas";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";

import { formatLongDateTime } from "../../format";
import { EventWorkflowStatusPill } from "../EventWorkflowStatusPill/EventWorkflowStatusPill";
import styles from "./ApprovalsQueue.module.css";

interface ApprovalsQueueProps {
  initialRows: ApprovalQueueRow[];
}

function submittedLabel(row: ApprovalQueueRow): string {
  const actor = row.submittedByName ?? row.createdByName;
  return `Submitted by ${actor} on ${formatLongDateTime(row.submittedAt.toISOString())}`;
}

export function ApprovalsQueue({ initialRows }: ApprovalsQueueProps) {
  const [rows, setRows] = useState(initialRows);
  const [approveRow, setApproveRow] = useState<ApprovalQueueRow | null>(null);
  const [revisionRow, setRevisionRow] = useState<ApprovalQueueRow | null>(null);

  function removeRow(eventId: string) {
    setRows((current) => current.filter((row) => row.id !== eventId));
  }

  return (
    <section className={styles.page} aria-labelledby="approvals-heading">
      <header className={styles.header}>
        <div>
          <h2 id="approvals-heading" className={styles.heading}>
            Events awaiting approval
          </h2>
          <p className={styles.subheading}>
            {rows.length === 0
              ? "Nothing is waiting for a decision."
              : `${rows.length} event${rows.length === 1 ? "" : "s"} waiting for a decision.`}
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>No events awaiting approval</h3>
          <p className={styles.emptyText}>
            Submitted events will appear here. Nothing is blocking publication right now.
          </p>
        </div>
      ) : (
        <div className={styles.queue}>
          {rows.map((row) => (
            <article key={row.id} className={styles.card} aria-labelledby={`event-${row.id}`}>
              <header className={styles.cardHeader}>
                <div className={styles.cardHeading}>
                  <h3 id={`event-${row.id}`} className={styles.title}>
                    {row.title}
                  </h3>
                  <p className={styles.meta}>
                    {formatLongDateTime(row.startAt.toISOString())} · {row.venue}
                  </p>
                  <p className={styles.meta}>{submittedLabel(row)}</p>
                </div>
                <EventWorkflowStatusPill status="SUBMITTED" />
              </header>

              {row.description && <p className={styles.description}>{row.description}</p>}

              <dl className={styles.details}>
                <div className={styles.detail}>
                  <dt className={styles.detailLabel}>Mechanics</dt>
                  <dd className={styles.detailText}>{row.mechanics ?? "Not provided"}</dd>
                </div>
                <div className={styles.detail}>
                  <dt className={styles.detailLabel}>Program flow</dt>
                  <dd className={styles.detailText}>{row.programFlow ?? "Not provided"}</dd>
                </div>
                <div className={styles.detail}>
                  <dt className={styles.detailLabel}>Requirements</dt>
                  <dd className={styles.detailText}>{row.requirements ?? "Not provided"}</dd>
                </div>
              </dl>

              <div className={styles.actions}>
                <Button variant="secondary" onPress={() => setRevisionRow(row)}>
                  Request revision
                </Button>
                <Button onPress={() => setApproveRow(row)}>Approve</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!approveRow}
        onOpenChange={(open) => {
          if (!open) setApproveRow(null);
        }}
        title="Approve and publish event"
        confirmLabel="Approve and publish"
        onConfirm={async () => {
          if (!approveRow) return;
          const result = await approveEventAction({ eventId: approveRow.id });
          if (!result.success) {
            toastActionError(result, "approve event");
            return;
          }
          const title = approveRow.title;
          setApproveRow(null);
          removeRow(approveRow.id);
          toastSuccess("Event published", `"${title}" is now published.`);
        }}
      >
        Approving <strong>{approveRow?.title}</strong> publishes it immediately. The decision is
        recorded in the approval trail.
      </ConfirmDialog>

      <DecisionModal
        isOpen={!!revisionRow}
        onOpenChange={(open) => {
          if (!open) setRevisionRow(null);
        }}
        title="Request revision"
        description={`Tell the organizer what must change before "${revisionRow?.title ?? "this event"}" can be published.`}
        reasonLabel="Revision comment"
        reasonPlaceholder="Explain what needs to change."
        confirmLabel="Request revision"
        reasonSchema={RequestEventRevisionSchema.shape.comment}
        onConfirm={async (reason) => {
          if (!revisionRow || !reason) return false;
          const result = await requestEventRevisionAction({
            eventId: revisionRow.id,
            comment: reason,
          });
          if (!result.success) {
            toastActionError(result, "request revision");
            return false;
          }
          const title = revisionRow.title;
          setRevisionRow(null);
          removeRow(revisionRow.id);
          toastSuccess(
            "Revision requested",
            `"${title}" has been sent back to the organizer for changes.`,
          );
        }}
      />
    </section>
  );
}
