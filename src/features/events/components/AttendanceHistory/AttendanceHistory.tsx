"use client";

import clsx from "clsx";
import { useState } from "react";
import type { IconType } from "react-icons";
import { FaCalendarCheck, FaCalendarDay } from "react-icons/fa6";

import { SearchField } from "@/components/ui/SearchField/SearchField";

import {
  attendanceRecords,
  filterAttendanceRecords,
  getAttendanceSummary,
  getCurrentMonthAttendance,
} from "../../attendance-data";
import { formatEventDateMedium, formatEventMonthYear, formatEventTime } from "../../format";
import { MOCK_NOW } from "../../types";
import styles from "./AttendanceHistory.module.css";

interface StatCard {
  id: "attended" | "month";
  label: string;
  value: number;
  caption: string;
  icon: IconType;
  tone: "attended" | "month";
}

interface StatCardContentProps {
  stat: StatCard;
}

function StatCardContent({ stat }: StatCardContentProps) {
  return (
    <>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{stat.label}</span>
        <span className={styles[`${stat.tone}Icon`]} aria-hidden="true">
          <stat.icon />
        </span>
      </div>
      <span className={styles.statValue}>{stat.value}</span>
      <span className={styles.statCaption}>{stat.caption}</span>
    </>
  );
}

export function AttendanceHistory() {
  const [showThisMonth, setShowThisMonth] = useState(false);
  const [query, setQuery] = useState("");
  const summary = getAttendanceSummary(attendanceRecords);
  const earliestRecord = attendanceRecords[attendanceRecords.length - 1];
  const monthLabel = formatEventMonthYear(MOCK_NOW);
  const visibleRecords = showThisMonth
    ? getCurrentMonthAttendance(attendanceRecords)
    : attendanceRecords;
  const filteredRecords = filterAttendanceRecords(visibleRecords, query);

  const stats: StatCard[] = [
    {
      id: "attended",
      label: "Events attended",
      value: summary.attended,
      caption: `Since ${formatEventMonthYear(earliestRecord.checkedInAt)}`,
      icon: FaCalendarCheck,
      tone: "attended",
    },
    {
      id: "month",
      label: "This month",
      value: summary.thisMonth,
      caption: monthLabel,
      icon: FaCalendarDay,
      tone: "month",
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.stats} aria-label="Attendance summary">
        {stats.map((stat) => {
          const isMonth = stat.id === "month";
          const isActive = isMonth ? showThisMonth : !showThisMonth;

          return (
            <button
              key={stat.id}
              type="button"
              className={clsx(styles.statCard, styles.interactiveCard)}
              aria-pressed={isActive}
              aria-label={
                isMonth && !showThisMonth
                  ? `Show only ${monthLabel} attendance records`
                  : "Show all attendance records"
              }
              onClick={() => setShowThisMonth(isMonth ? !showThisMonth : false)}
            >
              <StatCardContent stat={stat} />
            </button>
          );
        })}
      </section>

      <section className={styles.history} aria-labelledby="attendance-history-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeading}>
            <h2 id="attendance-history-heading" className={styles.sectionTitle}>
              Attendance history
            </h2>
            <p className={styles.sectionText}>
              {showThisMonth
                ? `Showing ${monthLabel} only.`
                : "Records are read-only and entered by the officers of each event."}
            </p>
          </div>
          <SearchField
            aria-label="Search attendance history"
            placeholder="Search by event or organizer"
            value={query}
            onChange={setQuery}
            className={styles.searchField}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Check-in time</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className={styles.eventTitle}>{record.eventTitle}</span>
                      <span className={styles.organizer}>{record.organizer}</span>
                    </td>
                    <td className={styles.checkIn}>
                      {formatEventDateMedium(record.checkedInAt)} ·{" "}
                      {formatEventTime(record.checkedInAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className={styles.empty}>
                    {query.trim()
                      ? `No attendance records match "${query.trim()}".`
                      : "No attendance records for this period."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
