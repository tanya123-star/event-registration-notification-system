import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AttendanceMethod,
  EventApprovalAction,
  EventStatus,
  RegistrationStatus,
} from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";

import {
  approveEvent,
  cancelEvent,
  cancelRegistration,
  createEvent,
  createRegistration,
  recordAttendance,
  requestEventRevision,
  submitEvent,
  updateEvent,
} from "./mutations";

const mocks = vi.hoisted(() => {
  const event = {
    create: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  };
  const eventApproval = {
    create: vi.fn(),
  };
  const registration = {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  };
  const attendance = {
    findUnique: vi.fn(),
    create: vi.fn(),
  };
  return {
    transaction: vi.fn(),
    event,
    eventApproval,
    registration,
    attendance,
  };
});

vi.mock("@/lib/infra/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    event: mocks.event,
    eventApproval: mocks.eventApproval,
    registration: mocks.registration,
    attendance: mocks.attendance,
  },
}));

const eventId = "c111111111111111111111111";
const actorId = "c222222222222222222222222";
const startAt = new Date("2026-11-12T08:00:00.000Z");
const endAt = new Date("2026-11-12T16:00:00.000Z");

const eventFields = {
  title: "Annual Science Fair 2026",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt,
  endAt,
  mechanics: "Doors open at 7:30 AM.",
  programFlow: "Opening remarks, exhibits, closing.",
  requirements: "Bring your student ID.",
  capacity: 400,
  registrationClosesAt: new Date("2026-11-10T17:00:00.000Z"),
};

beforeEach(() => {
  mocks.transaction.mockReset();
  mocks.event.create.mockReset();
  mocks.event.updateMany.mockReset();
  mocks.event.findUnique.mockReset();
  mocks.eventApproval.create.mockReset();
  mocks.registration.create.mockReset();
  mocks.registration.update.mockReset();
  mocks.registration.updateMany.mockReset();
  mocks.registration.findUnique.mockReset();
  mocks.registration.count.mockReset();
  mocks.attendance.findUnique.mockReset();
  mocks.attendance.create.mockReset();
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      event: mocks.event,
      eventApproval: mocks.eventApproval,
      registration: mocks.registration,
      attendance: mocks.attendance,
    }),
  );
  mocks.event.create.mockResolvedValue({ id: eventId });
  mocks.event.updateMany.mockResolvedValue({ count: 1 });
  mocks.eventApproval.create.mockResolvedValue({});
  mocks.registration.create.mockResolvedValue({ reference: "KASAMA-TESTREFERENCE" });
  mocks.registration.update.mockResolvedValue({ reference: "KASAMA-EXISTINGREF" });
  mocks.registration.updateMany.mockResolvedValue({ count: 1 });
  mocks.registration.findUnique.mockResolvedValue(null);
  mocks.registration.count.mockResolvedValue(0);
  mocks.attendance.findUnique.mockResolvedValue(null);
  mocks.attendance.create.mockResolvedValue({ checkedInAt: new Date() });
});

describe("createEvent", () => {
  it("creates a draft owned by the actor", async () => {
    await expect(createEvent({ ...eventFields, createdById: actorId })).resolves.toEqual({
      ok: true,
      eventId,
    });

    expect(mocks.event.create).toHaveBeenCalledWith({
      data: {
        ...eventFields,
        status: EventStatus.DRAFT,
        createdById: actorId,
      },
      select: { id: true },
    });
  });
});

describe("updateEvent", () => {
  it("updates a draft or revision-requested event", async () => {
    await expect(updateEvent({ eventId, ...eventFields })).resolves.toEqual({
      ok: true,
      eventId,
    });

    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: {
        id: eventId,
        status: { in: [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED] },
      },
      data: eventFields,
    });
  });

  it("rejects an event that is no longer editable", async () => {
    mocks.event.updateMany.mockResolvedValue({ count: 0 });
    mocks.event.findUnique.mockResolvedValue({ id: eventId });

    await expect(updateEvent({ eventId, ...eventFields })).resolves.toEqual({
      ok: false,
      reason: "not_editable",
    });
  });

  it("reports a missing event", async () => {
    mocks.event.updateMany.mockResolvedValue({ count: 0 });
    mocks.event.findUnique.mockResolvedValue(null);

    await expect(updateEvent({ eventId, ...eventFields })).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("submitEvent", () => {
  it("submits a draft and records the submission", async () => {
    mocks.event.findUnique.mockResolvedValue({
      status: EventStatus.DRAFT,
      mechanics: "Doors open at 7:30 AM.",
      programFlow: "Opening remarks.",
      requirements: "Bring your student ID.",
    });

    await expect(submitEvent({ eventId, actorId })).resolves.toEqual({
      ok: true,
      status: EventStatus.SUBMITTED,
    });

    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: { id: eventId, status: EventStatus.DRAFT },
      data: { status: EventStatus.SUBMITTED, publishedAt: null },
    });
    expect(mocks.eventApproval.create).toHaveBeenCalledWith({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.SUBMITTED,
        fromStatus: EventStatus.DRAFT,
        toStatus: EventStatus.SUBMITTED,
        comment: null,
      },
    });
  });

  it("submits a revision-requested event", async () => {
    mocks.event.findUnique.mockResolvedValue({
      status: EventStatus.REVISION_REQUESTED,
      mechanics: "Doors open at 7:30 AM.",
      programFlow: "Opening remarks.",
      requirements: "Bring your student ID.",
    });

    await submitEvent({ eventId, actorId });

    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: { id: eventId, status: EventStatus.REVISION_REQUESTED },
      data: { status: EventStatus.SUBMITTED, publishedAt: null },
    });
  });

  it.each([
    ["mechanics", { mechanics: null, programFlow: "Flow", requirements: "ID" }],
    ["program flow", { mechanics: "Doors", programFlow: "   ", requirements: "ID" }],
    ["requirements", { mechanics: "Doors", programFlow: "Flow", requirements: null }],
  ])("refuses to submit without %s", async (_field, details) => {
    mocks.event.findUnique.mockResolvedValue({
      status: EventStatus.DRAFT,
      ...details,
    });

    await expect(submitEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "missing_details",
    });

    expect(mocks.event.updateMany).not.toHaveBeenCalled();
    expect(mocks.eventApproval.create).not.toHaveBeenCalled();
  });

  it("rejects an event that is not a draft or revision request", async () => {
    mocks.event.findUnique.mockResolvedValue({
      status: EventStatus.PUBLISHED,
      mechanics: "Doors",
      programFlow: "Flow",
      requirements: "ID",
    });

    await expect(submitEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "not_submittable",
    });
  });

  it("reports a missing event", async () => {
    mocks.event.findUnique.mockResolvedValue(null);

    await expect(submitEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("cancelEvent", () => {
  it("cancels a published event and records the cancellation", async () => {
    mocks.event.findUnique.mockResolvedValue({ status: EventStatus.PUBLISHED });

    await expect(cancelEvent({ eventId, actorId })).resolves.toEqual({
      ok: true,
      status: EventStatus.CANCELLED,
    });

    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: { id: eventId, status: EventStatus.PUBLISHED },
      data: { status: EventStatus.CANCELLED, publishedAt: null },
    });
    expect(mocks.eventApproval.create).toHaveBeenCalledWith({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.CANCELLED,
        fromStatus: EventStatus.PUBLISHED,
        toStatus: EventStatus.CANCELLED,
        comment: null,
      },
    });
  });

  it("stores the optional cancellation comment", async () => {
    mocks.event.findUnique.mockResolvedValue({ status: EventStatus.DRAFT });

    await cancelEvent({ eventId, actorId, comment: "Venue unavailable." });

    expect(mocks.eventApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ comment: "Venue unavailable." }),
    });
  });

  it("rejects an already cancelled event", async () => {
    mocks.event.findUnique.mockResolvedValue({ status: EventStatus.CANCELLED });

    await expect(cancelEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "already_cancelled",
    });
  });

  it("reports a missing event", async () => {
    mocks.event.findUnique.mockResolvedValue(null);

    await expect(cancelEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("approveEvent", () => {
  it("publishes a submitted event and records the approval in one transaction", async () => {
    await expect(approveEvent({ eventId, actorId })).resolves.toEqual({
      ok: true,
      status: EventStatus.PUBLISHED,
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: { id: eventId, status: EventStatus.SUBMITTED },
      data: { status: EventStatus.PUBLISHED, publishedAt: expect.any(Date) },
    });
    expect(mocks.eventApproval.create).toHaveBeenCalledWith({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.APPROVED,
        fromStatus: EventStatus.SUBMITTED,
        toStatus: EventStatus.PUBLISHED,
        comment: null,
      },
    });
  });

  it("stores the optional approval comment", async () => {
    await approveEvent({ eventId, actorId, comment: "Approved after review." });

    expect(mocks.eventApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ comment: "Approved after review." }),
    });
  });

  it("does not publish an event that is not submitted", async () => {
    mocks.event.updateMany.mockResolvedValue({ count: 0 });
    mocks.event.findUnique.mockResolvedValue({ id: eventId });

    await expect(approveEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "not_submitted",
    });

    expect(mocks.eventApproval.create).not.toHaveBeenCalled();
  });

  it("reports a missing event", async () => {
    mocks.event.updateMany.mockResolvedValue({ count: 0 });
    mocks.event.findUnique.mockResolvedValue(null);

    await expect(approveEvent({ eventId, actorId })).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("requestEventRevision", () => {
  it("requests revision for a submitted event and clears the publication date", async () => {
    mocks.event.findUnique.mockResolvedValue({ status: EventStatus.SUBMITTED });

    await expect(
      requestEventRevision({ eventId, actorId, comment: "Add the program flow." }),
    ).resolves.toEqual({
      ok: true,
      status: EventStatus.REVISION_REQUESTED,
    });

    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: { id: eventId, status: EventStatus.SUBMITTED },
      data: { status: EventStatus.REVISION_REQUESTED, publishedAt: null },
    });
    expect(mocks.eventApproval.create).toHaveBeenCalledWith({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.REVISION_REQUESTED,
        fromStatus: EventStatus.SUBMITTED,
        toStatus: EventStatus.REVISION_REQUESTED,
        comment: "Add the program flow.",
      },
    });
  });

  it("unpublishes a published event for revision", async () => {
    mocks.event.findUnique.mockResolvedValue({ status: EventStatus.PUBLISHED });

    await expect(
      requestEventRevision({ eventId, actorId, comment: "Fix the mechanics." }),
    ).resolves.toEqual({
      ok: true,
      status: EventStatus.REVISION_REQUESTED,
    });

    expect(mocks.event.updateMany).toHaveBeenCalledWith({
      where: { id: eventId, status: EventStatus.PUBLISHED },
      data: { status: EventStatus.REVISION_REQUESTED, publishedAt: null },
    });
  });

  it("rejects an event that is not reviewable", async () => {
    mocks.event.findUnique.mockResolvedValue({ status: EventStatus.CANCELLED });

    await expect(
      requestEventRevision({ eventId, actorId, comment: "Add the program flow." }),
    ).resolves.toEqual({ ok: false, reason: "not_reviewable" });

    expect(mocks.event.updateMany).not.toHaveBeenCalled();
    expect(mocks.eventApproval.create).not.toHaveBeenCalled();
  });

  it("reports a missing event", async () => {
    mocks.event.findUnique.mockResolvedValue(null);

    await expect(
      requestEventRevision({ eventId, actorId, comment: "Add the program flow." }),
    ).resolves.toEqual({ ok: false, reason: "not_found" });
  });
});

const studentId = "c333333333333333333333333";
const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const futureDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);

const publishedEvent = {
  status: EventStatus.PUBLISHED,
  capacity: 100,
  registrationClosesAt: futureDeadline,
  startAt: futureStart,
};

describe("createRegistration", () => {
  it("creates a registration with an opaque reference", async () => {
    mocks.event.findUnique.mockResolvedValue(publishedEvent);
    mocks.registration.count.mockResolvedValue(10);

    await expect(createRegistration({ eventId, studentId })).resolves.toEqual({
      ok: true,
      reference: "KASAMA-TESTREFERENCE",
    });

    expect(mocks.registration.create).toHaveBeenCalledWith({
      data: {
        eventId,
        studentId,
        reference: expect.stringMatching(/^KASAMA-[0-9A-HJKMNP-TV-Z]{16}$/),
      },
      select: { reference: true },
    });
  });

  it("reuses the reference when a cancelled student registers again", async () => {
    mocks.event.findUnique.mockResolvedValue(publishedEvent);
    mocks.registration.findUnique.mockResolvedValue({
      id: "registration-1",
      status: RegistrationStatus.CANCELLED,
      reference: "KASAMA-OLDREFERENCE",
    });
    mocks.registration.update.mockResolvedValue({ reference: "KASAMA-OLDREFERENCE" });

    await expect(createRegistration({ eventId, studentId })).resolves.toEqual({
      ok: true,
      reference: "KASAMA-OLDREFERENCE",
    });

    expect(mocks.registration.update).toHaveBeenCalledWith({
      where: { id: "registration-1" },
      data: { status: RegistrationStatus.REGISTERED, cancelledAt: null },
      select: { reference: true },
    });
    expect(mocks.registration.create).not.toHaveBeenCalled();
  });

  it.each([
    ["missing event", { event: null, reason: "not_found" }],
    [
      "unpublished event",
      { event: { ...publishedEvent, status: EventStatus.DRAFT }, reason: "not_published" },
    ],
    ["started event", { event: { ...publishedEvent, startAt: pastStart }, reason: "started" }],
    [
      "closed deadline",
      { event: { ...publishedEvent, registrationClosesAt: pastDeadline }, reason: "closed" },
    ],
  ])("rejects a %s", async (_label, { event, reason }) => {
    mocks.event.findUnique.mockResolvedValue(event);

    await expect(createRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason,
    });

    expect(mocks.registration.create).not.toHaveBeenCalled();
  });

  it("rejects a full event", async () => {
    mocks.event.findUnique.mockResolvedValue({ ...publishedEvent, capacity: 10 });
    mocks.registration.count.mockResolvedValue(10);

    await expect(createRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason: "full",
    });

    expect(mocks.registration.create).not.toHaveBeenCalled();
  });

  it("rejects a student who is already registered", async () => {
    mocks.event.findUnique.mockResolvedValue(publishedEvent);
    mocks.registration.findUnique.mockResolvedValue({
      id: "registration-1",
      status: RegistrationStatus.REGISTERED,
      reference: "KASAMA-EXISTINGREF",
    });

    await expect(createRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason: "already_registered",
    });
  });

  it("retries once after a serialization conflict", async () => {
    mocks.event.findUnique.mockResolvedValue(publishedEvent);
    mocks.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Serialization conflict", {
        code: "P2034",
        clientVersion: "7.10.0",
      }),
    );

    await expect(createRegistration({ eventId, studentId })).resolves.toEqual({
      ok: true,
      reference: "KASAMA-TESTREFERENCE",
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });
});

describe("recordAttendance", () => {
  const reference = "KASAMA-TESTREFERENCE";

  const registered = {
    eventId,
    studentId: "c333333333333333333333333",
    status: RegistrationStatus.REGISTERED,
    event: { status: EventStatus.PUBLISHED },
  };

  it("persists the method and recording officer, then returns the check-in time", async () => {
    const checkedInAt = new Date("2026-11-12T08:30:00.000Z");
    mocks.registration.findUnique.mockResolvedValue(registered);
    mocks.attendance.create.mockResolvedValue({ checkedInAt });

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.MANUAL,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: true, checkedInAt });

    expect(mocks.attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId,
          studentId: registered.studentId,
          method: AttendanceMethod.MANUAL,
          recordedById: actorId,
        }),
      }),
    );
  });

  it("rejects an unknown reference", async () => {
    mocks.registration.findUnique.mockResolvedValue(null);

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.QR,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: false, reason: "not_found" });

    expect(mocks.attendance.create).not.toHaveBeenCalled();
  });

  it("rejects a registration that belongs to another event", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      ...registered,
      eventId: "c999999999999999999999999",
    });

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.QR,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: false, reason: "wrong_event" });

    expect(mocks.attendance.create).not.toHaveBeenCalled();
  });

  it("rejects a cancelled registration", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      ...registered,
      status: RegistrationStatus.CANCELLED,
    });

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.MANUAL,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: false, reason: "not_registered" });

    expect(mocks.attendance.create).not.toHaveBeenCalled();
  });

  it("rejects a registration whose event is no longer published", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      ...registered,
      event: { status: EventStatus.CANCELLED },
    });

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.QR,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: false, reason: "not_published" });

    expect(mocks.attendance.create).not.toHaveBeenCalled();
  });

  it("returns already_attended when a check-in row already exists", async () => {
    mocks.registration.findUnique.mockResolvedValue(registered);
    mocks.attendance.findUnique.mockResolvedValue({ id: "attendance-1" });

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.QR,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: false, reason: "already_attended" });

    expect(mocks.attendance.create).not.toHaveBeenCalled();
  });

  it("returns already_attended when a concurrent scan wins the unique constraint", async () => {
    mocks.registration.findUnique.mockResolvedValue(registered);
    mocks.attendance.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7.10.0",
      }),
    );

    await expect(
      recordAttendance({
        eventId,
        reference,
        method: AttendanceMethod.QR,
        recordedById: actorId,
      }),
    ).resolves.toEqual({ ok: false, reason: "already_attended" });
  });
});

describe("cancelRegistration", () => {
  it("cancels an active registration before the event starts", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      id: "registration-1",
      status: RegistrationStatus.REGISTERED,
      event: { startAt: futureStart },
    });

    await expect(cancelRegistration({ eventId, studentId })).resolves.toEqual({ ok: true });

    expect(mocks.registration.updateMany).toHaveBeenCalledWith({
      where: { id: "registration-1", status: RegistrationStatus.REGISTERED },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: expect.any(Date) },
    });
  });

  it("rejects a missing registration", async () => {
    mocks.registration.findUnique.mockResolvedValue(null);

    await expect(cancelRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("rejects an already cancelled registration", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      id: "registration-1",
      status: RegistrationStatus.CANCELLED,
      event: { startAt: futureStart },
    });

    await expect(cancelRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason: "not_registered",
    });
  });

  it("rejects cancellation after the event starts", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      id: "registration-1",
      status: RegistrationStatus.REGISTERED,
      event: { startAt: pastStart },
    });

    await expect(cancelRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason: "started",
    });
  });

  it("rejects cancellation after attendance is recorded", async () => {
    mocks.registration.findUnique.mockResolvedValue({
      id: "registration-1",
      status: RegistrationStatus.REGISTERED,
      event: { startAt: futureStart },
    });
    mocks.attendance.findUnique.mockResolvedValue({ id: "attendance-1" });

    await expect(cancelRegistration({ eventId, studentId })).resolves.toEqual({
      ok: false,
      reason: "attended",
    });
  });
});
