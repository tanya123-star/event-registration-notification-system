import "dotenv/config";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { EventStatus, RegistrationStatus, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

import { cancelRegistration, createRegistration } from "./mutations";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface RegistrationFixture {
  eventId: string;
  creatorId: string;
  studentId: string;
}

const fixture: RegistrationFixture = { eventId: "", creatorId: "", studentId: "" };

describe.skipIf(!process.env.DATABASE_URL)("student registration persistence", () => {
  beforeAll(async () => {
    const creator = await prisma.user.create({
      data: {
        email: `registration-creator-${suffix}@acdeducation.com`,
        name: "Registration Creator",
        role: Role.ADMIN,
      },
    });
    const student = await prisma.user.create({
      data: {
        email: `registration-student-${suffix}@acdeducation.com`,
        name: "Registration Student",
        role: Role.STUDENT,
      },
    });
    const event = await prisma.event.create({
      data: {
        title: `Registration Integration ${suffix}`,
        venue: "Test Hall",
        startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: EventStatus.PUBLISHED,
        publishedAt: new Date(),
        createdById: creator.id,
      },
    });

    fixture.creatorId = creator.id;
    fixture.studentId = student.id;
    fixture.eventId = event.id;
  });

  afterAll(async () => {
    if (!fixture.eventId) return;

    await prisma.registration.deleteMany({ where: { eventId: fixture.eventId } });
    await prisma.event.delete({ where: { id: fixture.eventId } });
    await prisma.user.deleteMany({ where: { id: { in: [fixture.creatorId, fixture.studentId] } } });
  });

  it("persists a registration row with its reference, then reuses the reference on re-registration", async () => {
    const created = await createRegistration({
      eventId: fixture.eventId,
      studentId: fixture.studentId,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.reference).toMatch(/^KASAMA-[0-9A-HJKMNP-TV-Z]{16}$/);

    const row = await prisma.registration.findUnique({
      where: {
        eventId_studentId: { eventId: fixture.eventId, studentId: fixture.studentId },
      },
      select: { reference: true, status: true },
    });
    expect(row).toEqual({
      reference: created.reference,
      status: RegistrationStatus.REGISTERED,
    });

    await expect(
      cancelRegistration({ eventId: fixture.eventId, studentId: fixture.studentId }),
    ).resolves.toEqual({ ok: true });

    const cancelled = await prisma.registration.findUnique({
      where: {
        eventId_studentId: { eventId: fixture.eventId, studentId: fixture.studentId },
      },
      select: { status: true },
    });
    expect(cancelled?.status).toBe(RegistrationStatus.CANCELLED);

    const again = await createRegistration({
      eventId: fixture.eventId,
      studentId: fixture.studentId,
    });
    expect(again).toEqual({ ok: true, reference: created.reference });

    const count = await prisma.registration.count({
      where: { eventId: fixture.eventId, studentId: fixture.studentId },
    });
    expect(count).toBe(1);
  });

  it("does not create a second active registration for the same student and event", async () => {
    await expect(
      createRegistration({ eventId: fixture.eventId, studentId: fixture.studentId }),
    ).resolves.toEqual({ ok: false, reason: "already_registered" });

    const count = await prisma.registration.count({
      where: { eventId: fixture.eventId, studentId: fixture.studentId },
    });
    expect(count).toBe(1);
  });
});
