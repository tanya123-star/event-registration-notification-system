import {
  AttendanceMethod,
  EventApprovalAction,
  EventStatus,
  RegistrationStatus,
} from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/infra/prisma";

import { createRegistrationReference } from "./reference";

export interface EventApprovalPayload {
  eventId: string;
  actorId: string;
  comment?: string | null;
}

export interface EventRevisionPayload extends EventApprovalPayload {
  comment: string;
}

export interface EventWritePayload {
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  mechanics: string | null;
  programFlow: string | null;
  requirements: string | null;
  capacity: number | null;
  registrationClosesAt: Date | null;
}

export interface CreateEventPayload extends EventWritePayload {
  createdById: string;
}

export interface UpdateEventPayload extends EventWritePayload {
  eventId: string;
}

export interface EventTransitionPayload {
  eventId: string;
  actorId: string;
  comment?: string | null;
}

export type EventApprovalWriteResult =
  { ok: true; status: EventStatus } | { ok: false; reason: "not_found" | "not_submitted" };

export type EventRevisionWriteResult =
  { ok: true; status: EventStatus } | { ok: false; reason: "not_found" | "not_reviewable" };

export type EventWriteResult =
  { ok: true; eventId: string } | { ok: false; reason: "not_found" | "not_editable" };

export type EventSubmitResult =
  | { ok: true; status: EventStatus }
  | { ok: false; reason: "not_found" | "not_submittable" | "missing_details" };

export type EventCancelResult =
  { ok: true; status: EventStatus } | { ok: false; reason: "not_found" | "already_cancelled" };

const REVIEWABLE_STATUSES: EventStatus[] = [
  EventStatus.SUBMITTED,
  EventStatus.PUBLISHED,
  EventStatus.APPROVED,
];

export async function createEvent(payload: CreateEventPayload): Promise<EventWriteResult> {
  const { createdById, ...fields } = payload;
  const event = await prisma.event.create({
    data: {
      ...fields,
      status: EventStatus.DRAFT,
      createdById,
    },
    select: { id: true },
  });

  return { ok: true, eventId: event.id };
}

export async function updateEvent(payload: UpdateEventPayload): Promise<EventWriteResult> {
  const { eventId, ...fields } = payload;
  const updated = await prisma.event.updateMany({
    where: {
      id: eventId,
      status: { in: [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED] },
    },
    data: fields,
  });

  if (updated.count > 0) return { ok: true, eventId };

  const exists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  return { ok: false, reason: exists ? "not_editable" : "not_found" };
}

export async function submitEvent(payload: EventTransitionPayload): Promise<EventSubmitResult> {
  const { eventId, actorId } = payload;

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        status: true,
        mechanics: true,
        programFlow: true,
        requirements: true,
      },
    });

    if (!event) return { ok: false, reason: "not_found" };
    if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.REVISION_REQUESTED) {
      return { ok: false, reason: "not_submittable" };
    }
    if (!event.mechanics?.trim() || !event.programFlow?.trim() || !event.requirements?.trim()) {
      return { ok: false, reason: "missing_details" };
    }

    const updated = await tx.event.updateMany({
      where: { id: eventId, status: event.status },
      data: { status: EventStatus.SUBMITTED, publishedAt: null },
    });

    if (updated.count === 0) return { ok: false, reason: "not_submittable" };

    await tx.eventApproval.create({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.SUBMITTED,
        fromStatus: event.status,
        toStatus: EventStatus.SUBMITTED,
        comment: null,
      },
    });

    return { ok: true, status: EventStatus.SUBMITTED };
  });
}

export async function cancelEvent(payload: EventTransitionPayload): Promise<EventCancelResult> {
  const { eventId, actorId, comment } = payload;

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!event) return { ok: false, reason: "not_found" };
    if (event.status === EventStatus.CANCELLED) return { ok: false, reason: "already_cancelled" };

    const updated = await tx.event.updateMany({
      where: { id: eventId, status: event.status },
      data: { status: EventStatus.CANCELLED, publishedAt: null },
    });

    if (updated.count === 0) return { ok: false, reason: "already_cancelled" };

    await tx.eventApproval.create({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.CANCELLED,
        fromStatus: event.status,
        toStatus: EventStatus.CANCELLED,
        comment: comment ?? null,
      },
    });

    return { ok: true, status: EventStatus.CANCELLED };
  });
}

export async function approveEvent(
  payload: EventApprovalPayload,
): Promise<EventApprovalWriteResult> {
  const { eventId, actorId, comment } = payload;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.event.updateMany({
      where: { id: eventId, status: EventStatus.SUBMITTED },
      data: { status: EventStatus.PUBLISHED, publishedAt: new Date() },
    });

    if (updated.count === 0) {
      const exists = await tx.event.findUnique({ where: { id: eventId }, select: { id: true } });
      return { ok: false, reason: exists ? "not_submitted" : "not_found" };
    }

    await tx.eventApproval.create({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.APPROVED,
        fromStatus: EventStatus.SUBMITTED,
        toStatus: EventStatus.PUBLISHED,
        comment: comment ?? null,
      },
    });

    return { ok: true, status: EventStatus.PUBLISHED };
  });
}

export async function requestEventRevision(
  payload: EventRevisionPayload,
): Promise<EventRevisionWriteResult> {
  const { eventId, actorId, comment } = payload;

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!event) return { ok: false, reason: "not_found" };
    if (!REVIEWABLE_STATUSES.includes(event.status)) {
      return { ok: false, reason: "not_reviewable" };
    }

    const updated = await tx.event.updateMany({
      where: { id: eventId, status: event.status },
      data: { status: EventStatus.REVISION_REQUESTED, publishedAt: null },
    });

    if (updated.count === 0) return { ok: false, reason: "not_reviewable" };

    await tx.eventApproval.create({
      data: {
        eventId,
        actorId,
        action: EventApprovalAction.REVISION_REQUESTED,
        fromStatus: event.status,
        toStatus: EventStatus.REVISION_REQUESTED,
        comment,
      },
    });

    return { ok: true, status: EventStatus.REVISION_REQUESTED };
  });
}

export interface RegistrationPayload {
  eventId: string;
  studentId: string;
}

export type RegistrationCreateResult =
  | { ok: true; reference: string }
  | {
      ok: false;
      reason: "not_found" | "not_published" | "started" | "closed" | "full" | "already_registered";
    };

export type RegistrationCancelResult =
  { ok: true } | { ok: false; reason: "not_found" | "not_registered" | "started" | "attended" };

function isSerializationConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

async function runRegistrationTransaction(
  payload: RegistrationPayload,
): Promise<RegistrationCreateResult> {
  const { eventId, studentId } = payload;

  return prisma.$transaction(
    async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          status: true,
          capacity: true,
          registrationClosesAt: true,
          startAt: true,
        },
      });

      if (!event) return { ok: false, reason: "not_found" };
      if (event.status !== EventStatus.PUBLISHED) {
        return { ok: false, reason: "not_published" };
      }

      const now = new Date();
      if (event.startAt.getTime() <= now.getTime()) {
        return { ok: false, reason: "started" };
      }
      if (event.registrationClosesAt && event.registrationClosesAt.getTime() <= now.getTime()) {
        return { ok: false, reason: "closed" };
      }

      const existing = await tx.registration.findUnique({
        where: { eventId_studentId: { eventId, studentId } },
        select: { id: true, status: true, reference: true },
      });

      if (existing?.status === RegistrationStatus.REGISTERED) {
        return { ok: false, reason: "already_registered" };
      }

      if (event.capacity !== null) {
        const registeredCount = await tx.registration.count({
          where: { eventId, status: RegistrationStatus.REGISTERED },
        });
        if (registeredCount >= event.capacity) return { ok: false, reason: "full" };
      }

      if (existing) {
        const updated = await tx.registration.update({
          where: { id: existing.id },
          data: { status: RegistrationStatus.REGISTERED, cancelledAt: null },
          select: { reference: true },
        });
        return { ok: true, reference: updated.reference };
      }

      const created = await tx.registration.create({
        data: {
          eventId,
          studentId,
          reference: createRegistrationReference(),
        },
        select: { reference: true },
      });

      return { ok: true, reference: created.reference };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/**
 * Registers a student for a published event, retrying once on a serialization conflict.
 *
 * Capacity and the deadline are checked inside a serializable transaction so two
 * students cannot claim the last seat.
 */
export async function createRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationCreateResult> {
  try {
    return await runRegistrationTransaction(payload);
  } catch (error) {
    if (isSerializationConflict(error)) return runRegistrationTransaction(payload);
    throw error;
  }
}

export async function cancelRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationCancelResult> {
  const { eventId, studentId } = payload;

  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { eventId_studentId: { eventId, studentId } },
      select: {
        id: true,
        status: true,
        event: { select: { startAt: true } },
      },
    });

    if (!registration) return { ok: false, reason: "not_found" };
    if (registration.status !== RegistrationStatus.REGISTERED) {
      return { ok: false, reason: "not_registered" };
    }
    if (registration.event.startAt.getTime() <= Date.now()) {
      return { ok: false, reason: "started" };
    }

    const attendance = await tx.attendance.findUnique({
      where: { eventId_studentId: { eventId, studentId } },
      select: { id: true },
    });
    if (attendance) return { ok: false, reason: "attended" };

    const updated = await tx.registration.updateMany({
      where: { id: registration.id, status: RegistrationStatus.REGISTERED },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    });

    if (updated.count === 0) return { ok: false, reason: "not_registered" };

    return { ok: true };
  });
}

export interface AttendanceRecordPayload {
  eventId: string;
  reference: string;
  method: AttendanceMethod;
  recordedById: string;
}

export type AttendanceRecordResult =
  | { ok: true; checkedInAt: Date }
  | {
      ok: false;
      reason: "not_found" | "wrong_event" | "not_registered" | "not_published" | "already_attended";
    };

/**
 * Records attendance for a verified registration reference.
 *
 * The `Attendance` unique constraint on `(eventId, studentId)` is the
 * concurrency boundary: two officers scanning the same reference produce one
 * row and one `already_attended` result. Validation and the write are kept on
 * a single connection path so a cancelled registration or unpublished event
 * cannot slip through between checks.
 */
export async function recordAttendance(
  payload: AttendanceRecordPayload,
): Promise<AttendanceRecordResult> {
  const { eventId, reference, method, recordedById } = payload;

  const registration = await prisma.registration.findUnique({
    where: { reference },
    select: {
      eventId: true,
      studentId: true,
      status: true,
      event: { select: { status: true } },
    },
  });

  if (!registration) return { ok: false, reason: "not_found" };
  if (registration.eventId !== eventId) return { ok: false, reason: "wrong_event" };
  if (registration.status !== RegistrationStatus.REGISTERED) {
    return { ok: false, reason: "not_registered" };
  }
  if (registration.event.status !== EventStatus.PUBLISHED) {
    return { ok: false, reason: "not_published" };
  }

  const existing = await prisma.attendance.findUnique({
    where: { eventId_studentId: { eventId, studentId: registration.studentId } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already_attended" };

  try {
    const created = await prisma.attendance.create({
      data: {
        eventId,
        studentId: registration.studentId,
        method,
        recordedById,
        photoUrl: "",
      },
      select: { checkedInAt: true },
    });
    return { ok: true, checkedInAt: created.checkedInAt };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "already_attended" };
    }
    throw error;
  }
}
