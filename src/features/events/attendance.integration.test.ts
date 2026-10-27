import "dotenv/config";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  AttendanceMethod,
  EventStatus,
  RegistrationStatus,
  Role,
} from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

import { recordAttendance } from "./mutations";
import { getEventAttendanceStats } from "./queries";
import { createRegistrationReference } from "./reference";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface AttendanceFixture {
  eventId: string;
  officerId: string;
  studentIds: string[];
  references: string[];
}

const fixture: AttendanceFixture = {
  eventId: "",
  officerId: "",
  studentIds: [],
  references: [],
};

describe.skipIf(!process.env.DATABASE_URL)("attendance check-in integration", () => {
  beforeAll(async () => {
    const officer = await prisma.user.create({
      data: {
        email: `attendance-officer-${suffix}@acdeducation.com`,
        name: "Attendance Officer",
        role: Role.OFFICER,
      },
    });

    const students = await Promise.all(
      [1, 2, 3].map((index) =>
        prisma.user.create({
          data: {
            email: `attendance-student-${index}-${suffix}@acdeducation.com`,
            name: `Attendance Student ${index}`,
            role: Role.STUDENT,
            studentNumber: `ATT-${suffix}-${index}`,
          },
        }),
      ),
    );

    const event = await prisma.event.create({
      data: {
        title: `Attendance Integration ${suffix}`,
        venue: "Test Hall",
        startAt: new Date(),
        status: EventStatus.PUBLISHED,
        publishedAt: new Date(),
        createdById: officer.id,
      },
    });

    const registrations = await Promise.all(
      students.map((student) =>
        prisma.registration.create({
          data: {
            eventId: event.id,
            studentId: student.id,
            reference: createRegistrationReference(),
            status: RegistrationStatus.REGISTERED,
          },
        }),
      ),
    );

    fixture.eventId = event.id;
    fixture.officerId = officer.id;
    fixture.studentIds = students.map((student) => student.id);
    fixture.references = registrations.map((registration) => registration.reference);
  });

  afterAll(async () => {
    if (!fixture.eventId) return;

    await prisma.attendance.deleteMany({ where: { eventId: fixture.eventId } });
    await prisma.registration.deleteMany({ where: { eventId: fixture.eventId } });
    await prisma.event.delete({ where: { id: fixture.eventId } });
    await prisma.user.deleteMany({
      where: { id: { in: [fixture.officerId, ...fixture.studentIds] } },
    });
  });

  it("persists the check-in with its method, officer, and timestamp", async () => {
    const result = await recordAttendance({
      eventId: fixture.eventId,
      reference: fixture.references[0],
      method: AttendanceMethod.QR,
      recordedById: fixture.officerId,
    });

    expect(result.ok).toBe(true);

    const row = await prisma.attendance.findUnique({
      where: {
        eventId_studentId: {
          eventId: fixture.eventId,
          studentId: fixture.studentIds[0],
        },
      },
      select: { method: true, recordedById: true, checkedInAt: true },
    });

    expect(row).toEqual({
      method: AttendanceMethod.QR,
      recordedById: fixture.officerId,
      checkedInAt: expect.any(Date),
    });

    await expect(getEventAttendanceStats(fixture.eventId)).resolves.toEqual({
      registered: 3,
      checkedIn: 1,
      notCheckedIn: 2,
      todayCheckIns: 1,
      completionRate: 33,
    });
  });

  it("rejects a second check-in for the same registration", async () => {
    const result = await recordAttendance({
      eventId: fixture.eventId,
      reference: fixture.references[0],
      method: AttendanceMethod.MANUAL,
      recordedById: fixture.officerId,
    });

    expect(result).toEqual({ ok: false, reason: "already_attended" });

    const count = await prisma.attendance.count({
      where: { eventId: fixture.eventId, studentId: fixture.studentIds[0] },
    });
    expect(count).toBe(1);
  });

  it("keeps exactly one row when two officers check in the same student concurrently", async () => {
    const [first, second] = await Promise.all([
      recordAttendance({
        eventId: fixture.eventId,
        reference: fixture.references[1],
        method: AttendanceMethod.QR,
        recordedById: fixture.officerId,
      }),
      recordAttendance({
        eventId: fixture.eventId,
        reference: fixture.references[1],
        method: AttendanceMethod.MANUAL,
        recordedById: fixture.officerId,
      }),
    ]);

    const results = [first, second];
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results).toContainEqual({ ok: false, reason: "already_attended" });

    const count = await prisma.attendance.count({
      where: { eventId: fixture.eventId, studentId: fixture.studentIds[1] },
    });
    expect(count).toBe(1);
  });

  it("rejects an unknown reference without writing a row", async () => {
    const result = await recordAttendance({
      eventId: fixture.eventId,
      reference: "KASAMA-UNKNOWNREFERENCE",
      method: AttendanceMethod.QR,
      recordedById: fixture.officerId,
    });

    expect(result).toEqual({ ok: false, reason: "not_found" });

    const count = await prisma.attendance.count({ where: { eventId: fixture.eventId } });
    expect(count).toBe(2);
  });
});
