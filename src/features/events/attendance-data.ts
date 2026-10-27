import { getAppTimeZone } from "@/lib/primitives/date";

import { MOCK_NOW } from "./types";

export interface AttendanceRecord {
  id: string;
  eventTitle: string;
  organizer: string;
  checkedInAt: string;
  walkIn: boolean;
}

export interface AttendanceSummary {
  attended: number;
  walkIns: number;
  thisMonth: number;
}

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: "debate-semifinals",
    eventTitle: "Debate Semifinals",
    organizer: "KASAMA",
    checkedInAt: "2026-10-20T13:12:00+08:00",
    walkIn: false,
  },
  {
    id: "foundation-day-mass",
    eventTitle: "Foundation Day Mass",
    organizer: "KASAMA",
    checkedInAt: "2026-10-15T08:41:00+08:00",
    walkIn: false,
  },
  {
    id: "open-mic-night",
    eventTitle: "Open Mic Night",
    organizer: "KASAMA",
    checkedInAt: "2026-10-09T17:22:00+08:00",
    walkIn: false,
  },
  {
    id: "chemistry-demonstration",
    eventTitle: "Chemistry Demonstration",
    organizer: "KASAMA",
    checkedInAt: "2026-10-02T15:05:00+08:00",
    walkIn: true,
  },
  {
    id: "campus-clean-up-drive",
    eventTitle: "Campus Clean-up Drive",
    organizer: "KASAMA",
    checkedInAt: "2026-09-26T07:58:00+08:00",
    walkIn: false,
  },
  {
    id: "chess-invitational",
    eventTitle: "Chess Invitational",
    organizer: "KASAMA",
    checkedInAt: "2026-09-19T13:30:00+08:00",
    walkIn: true,
  },
  {
    id: "robotics-expo",
    eventTitle: "Robotics Expo",
    organizer: "KASAMA",
    checkedInAt: "2026-09-12T10:15:00+08:00",
    walkIn: false,
  },
  {
    id: "leadership-summit",
    eventTitle: "Leadership Summit",
    organizer: "KASAMA",
    checkedInAt: "2026-09-05T09:00:00+08:00",
    walkIn: false,
  },
  {
    id: "quiz-bee-finals",
    eventTitle: "Quiz Bee Finals",
    organizer: "KASAMA",
    checkedInAt: "2026-08-29T14:45:00+08:00",
    walkIn: false,
  },
  {
    id: "film-screening",
    eventTitle: "Film Screening",
    organizer: "KASAMA",
    checkedInAt: "2026-08-22T16:20:00+08:00",
    walkIn: false,
  },
  {
    id: "sports-fest-opening",
    eventTitle: "Sports Fest Opening",
    organizer: "KASAMA",
    checkedInAt: "2026-08-15T07:30:00+08:00",
    walkIn: false,
  },
  {
    id: "welcome-assembly",
    eventTitle: "Welcome Assembly",
    organizer: "KASAMA",
    checkedInAt: "2026-08-08T08:00:00+08:00",
    walkIn: false,
  },
];

function getMonthKey(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getAppTimeZone(),
    year: "numeric",
    month: "2-digit",
  }).format(new Date(date));
}

export function getCurrentMonthAttendance(
  records: AttendanceRecord[],
  now: string | Date = MOCK_NOW,
): AttendanceRecord[] {
  const currentMonth = getMonthKey(now);
  return records.filter((record) => getMonthKey(record.checkedInAt) === currentMonth);
}

export function getAttendanceSummary(
  records: AttendanceRecord[],
  now: string | Date = MOCK_NOW,
): AttendanceSummary {
  return {
    attended: records.length,
    walkIns: records.filter((record) => record.walkIn).length,
    thisMonth: getCurrentMonthAttendance(records, now).length,
  };
}

export function filterAttendanceRecords(
  records: AttendanceRecord[],
  query: string,
): AttendanceRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return records;

  return records.filter(
    (record) =>
      record.eventTitle.toLowerCase().includes(normalizedQuery) ||
      record.organizer.toLowerCase().includes(normalizedQuery),
  );
}
