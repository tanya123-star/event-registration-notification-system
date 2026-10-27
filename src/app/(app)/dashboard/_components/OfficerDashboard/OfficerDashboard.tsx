"use client";

import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaClipboardCheck,
  FaListUl,
  FaQrcode,
  FaUserCheck,
  FaUserClock,
  FaUserGroup,
} from "react-icons/fa6";

import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import type {
  AttendanceEventOption,
  AttendanceRecordRow,
  AttendanceStats,
} from "@/features/events/queries";
import { formatDate, formatDateTime } from "@/lib/primitives/date";

import styles from "./OfficerDashboard.module.css";

interface OfficerDashboardProps {
  greeting: string;
  userName: string | null;
  options: AttendanceEventOption[];
  selectedEvent: AttendanceEventOption | null;
  stats: AttendanceStats | null;
  recent: AttendanceRecordRow[];
}

interface StatCard {
  id: string;
  label: string;
  hint: string;
  value: string;
  icon: IconType;
}

function methodLabel(method: AttendanceRecordRow["method"]): string {
  return method === "QR" ? "QR scan" : "Manual entry";
}

export function OfficerDashboard({
  greeting,
  userName,
  options,
  selectedEvent,
  stats,
  recent,
}: OfficerDashboardProps) {
  const router = useRouter();
  const firstName = userName?.split(" ")[0];

  function handleEventChange(key: string | null) {
    const option = options.find((candidate) => candidate.id === key);
    if (!option || option.id === selectedEvent?.id) return;
    router.push(`/dashboard?event=${option.id}`);
  }

  if (!selectedEvent || !stats) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Officer</p>
          <h2 className={styles.title}>
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h2>
          <p className={styles.subtitle}>
            No published events with registrations yet. Attendance tools unlock when students start
            registering.
          </p>
        </header>
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>Nothing to monitor yet</p>
          <p className={styles.emptyText}>
            Publish an event and collect registrations to start checking students in.
          </p>
        </div>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      id: "registered",
      label: "Registered students",
      hint: "Active registrations",
      value: stats.registered.toLocaleString(),
      icon: FaUserGroup,
    },
    {
      id: "checked-in",
      label: "Checked in",
      hint: `${stats.completionRate}% of registrants`,
      value: stats.checkedIn.toLocaleString(),
      icon: FaUserCheck,
    },
    {
      id: "not-checked-in",
      label: "Not yet checked in",
      hint: "Still to arrive",
      value: stats.notCheckedIn.toLocaleString(),
      icon: FaUserClock,
    },
    {
      id: "today",
      label: "Today's check-ins",
      hint: "Since midnight",
      value: stats.todayCheckIns.toLocaleString(),
      icon: FaClipboardCheck,
    },
    {
      id: "completion",
      label: "Attendance completion",
      hint: "Checked in ÷ registered",
      value: `${stats.completionRate}%`,
      icon: FaListUl,
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Officer</p>
          <h2 className={styles.title}>
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h2>
          <p className={styles.subtitle}>
            Attendance overview for {selectedEvent.title} · {formatDate(selectedEvent.startAt)} ·{" "}
            {selectedEvent.venue}
          </p>
        </div>
        <Select
          aria-label="Select event"
          value={selectedEvent.id}
          onChange={(key) => {
            if (typeof key === "string") handleEventChange(key);
          }}
          className={styles.select}
        >
          {options.map((option) => (
            <SelectItem key={option.id} id={option.id}>
              {option.title} — {formatDate(option.startAt)}
            </SelectItem>
          ))}
        </Select>
      </header>

      <ul className={styles.stats}>
        {statCards.map((stat) => (
          <li key={stat.id} className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statIcon} aria-hidden="true">
                <stat.icon />
              </span>
            </div>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statHint}>{stat.hint}</span>
          </li>
        ))}
      </ul>

      <div className={styles.rails}>
        <section className={styles.panel} aria-labelledby="officer-recent-title">
          <div className={styles.panelHeader}>
            <h3 id="officer-recent-title" className={styles.panelTitle}>
              Recent attendance
            </h3>
            <ButtonLink
              variant="ghost"
              href={`/attendance/records?event=${selectedEvent.id}`}
              className={styles.panelLink}
            >
              View records
              <FaArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>

          {recent.length > 0 ? (
            <ul className={styles.recordList}>
              {recent.map((row) => (
                <li key={row.id} className={styles.recordRow}>
                  <span className={styles.recordName}>{row.studentName}</span>
                  <span className={styles.recordMeta}>
                    {methodLabel(row.method)} · {formatDateTime(row.checkedInAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyText}>No check-ins recorded for this event yet.</p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="officer-actions-title">
          <div className={styles.panelHeader}>
            <h3 id="officer-actions-title" className={styles.panelTitle}>
              Quick actions
            </h3>
          </div>
          <div className={styles.actions}>
            <ButtonLink
              variant="primary"
              href={`/attendance/scanner?event=${selectedEvent.id}`}
              className={styles.action}
            >
              <FaQrcode aria-hidden="true" />
              Open attendance scanner
            </ButtonLink>
            <ButtonLink
              variant="secondary"
              href={`/attendance/records?event=${selectedEvent.id}`}
              className={styles.action}
            >
              <FaListUl aria-hidden="true" />
              View attendance records
            </ButtonLink>
            <p className={styles.actionHint}>
              Scans and manual references are verified against the selected event before check-in.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
