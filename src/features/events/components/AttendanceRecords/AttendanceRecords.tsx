import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { formatDateTime } from "@/lib/primitives/date";

import type { AttendanceEventOption, AttendanceRecordRow } from "../../queries";
import { AttendanceFilters } from "./AttendanceFilters";
import styles from "./AttendanceRecords.module.css";

interface AttendanceRecordsProps {
  options: AttendanceEventOption[];
  rows: AttendanceRecordRow[];
  nextHref: string | null;
  filters: {
    eventId?: string;
    search?: string;
    method?: "QR" | "MANUAL";
    date?: string;
  };
}

export function AttendanceRecords({ options, rows, nextHref, filters }: AttendanceRecordsProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Officer / Attendance</p>
        <h1 className={styles.title}>Attendance Records</h1>
        <p className={styles.subtitle}>
          Every check-in is stored with its event, method, and recording officer.
        </p>
      </header>

      <AttendanceFilters
        options={options}
        initialEventId={filters.eventId}
        initialSearch={filters.search}
        initialMethod={filters.method}
        initialDate={filters.date}
      />

      {rows.length > 0 ? (
        <>
          <p className={styles.summary} aria-live="polite">
            {rows.length} {rows.length === 1 ? "record" : "records"} on this page
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Event</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Checked in</th>
                  <th scope="col">Method</th>
                  <th scope="col">Recorded by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={styles.studentName}>{row.studentName}</span>
                      <span className={styles.studentMeta}>
                        {row.studentNumber ?? "No student number"}
                      </span>
                    </td>
                    <td className={styles.eventTitle}>{row.eventTitle}</td>
                    <td>
                      <code className={styles.reference}>{row.reference ?? "—"}</code>
                    </td>
                    <td className={styles.date}>{formatDateTime(row.checkedInAt)}</td>
                    <td>
                      <span className={row.method === "QR" ? styles.qrPill : styles.manualPill}>
                        {row.method === "QR" ? "QR scan" : "Manual entry"}
                      </span>
                    </td>
                    <td className={styles.recordedBy}>{row.recordedByName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextHref && (
            <div className={styles.pagination}>
              <ButtonLink variant="secondary" href={nextHref}>
                Next page
              </ButtonLink>
            </div>
          )}
        </>
      ) : (
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>No attendance records</p>
          <p className={styles.emptyText}>
            No check-ins match these filters yet. Adjust the filters or scan a student to create the
            first record.
          </p>
        </div>
      )}
    </div>
  );
}
