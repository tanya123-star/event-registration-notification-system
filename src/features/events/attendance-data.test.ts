import { describe, expect, it } from "vitest";

import {
  attendanceRecords,
  filterAttendanceRecords,
  getAttendanceSummary,
  getCurrentMonthAttendance,
  type AttendanceRecord,
} from "./attendance-data";

const baseRecord: AttendanceRecord = {
  id: "record",
  eventTitle: "Event",
  organizer: "KASAMA",
  checkedInAt: "2026-10-02T15:05:00+08:00",
  walkIn: false,
};

describe("getCurrentMonthAttendance", () => {
  it("keeps only records checked in during the current month", () => {
    const records: AttendanceRecord[] = [
      baseRecord,
      { ...baseRecord, id: "september", checkedInAt: "2026-09-30T23:59:00+08:00" },
    ];

    expect(getCurrentMonthAttendance(records, "2026-10-22T00:00:00+08:00")).toEqual([baseRecord]);
  });
});

describe("filterAttendanceRecords", () => {
  it("returns all records when the query is empty", () => {
    expect(filterAttendanceRecords(attendanceRecords, "   ")).toEqual(attendanceRecords);
  });

  it.each([
    ["debate", "debate-semifinals"],
    ["chemistry", "chemistry-demonstration"],
    ["  robotics  ", "robotics-expo"],
  ])("matches event titles and organizers for %s", (query, id) => {
    expect(filterAttendanceRecords(attendanceRecords, query).map((record) => record.id)).toEqual([
      id,
    ]);
  });

  it("returns no records when nothing matches", () => {
    expect(filterAttendanceRecords(attendanceRecords, "astronomy")).toEqual([]);
  });
});

describe("getAttendanceSummary", () => {
  it("counts attended events and walk-ins", () => {
    const records: AttendanceRecord[] = [
      baseRecord,
      { ...baseRecord, id: "walk-in", walkIn: true },
    ];

    expect(getAttendanceSummary(records, "2026-10-22T00:00:00+08:00")).toEqual({
      attended: 2,
      walkIns: 1,
      thisMonth: 2,
    });
  });

  it("counts only records from the current month", () => {
    const records: AttendanceRecord[] = [
      baseRecord,
      { ...baseRecord, id: "september", checkedInAt: "2026-09-30T23:59:00+08:00" },
    ];

    expect(getAttendanceSummary(records, "2026-10-22T00:00:00+08:00").thisMonth).toBe(1);
  });

  it("derives the mock attendance history summary", () => {
    expect(getAttendanceSummary(attendanceRecords)).toEqual({
      attended: 12,
      walkIns: 2,
      thisMonth: 4,
    });
  });
});
