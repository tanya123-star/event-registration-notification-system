import {
  AttendanceMethod,
  EventApprovalAction,
  EventStatus,
  RegistrationStatus,
  TaskType,
} from "@/generated/prisma/browser";
import { Prisma, type Event } from "@/generated/prisma/client";
import {
  decodeTimestampCursor,
  encodeTimestampCursor,
  resolveCursorPageSize,
  type CursorPage,
} from "@/lib/domain/pagination";
import { prisma } from "@/lib/infra/prisma";
import { getEndOfDay, getStartOfDay } from "@/lib/primitives/date";

import { getRemainingSeats, isEventStarted, resolveEventStatus } from "./status";
import type { EventRegistration, EventView, StudentEvent } from "./types";

export type EventRow = Pick<
  Event,
  "id" | "title" | "description" | "venue" | "startAt" | "endAt"
> & {
  organizer: string;
};

export interface ApprovalQueueRow {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  mechanics: string | null;
  programFlow: string | null;
  requirements: string | null;
  createdByName: string;
  submittedByName: string | null;
  submittedAt: Date;
}

export async function getApprovalQueue(): Promise<ApprovalQueueRow[]> {
  const events = await prisma.event.findMany({
    where: { status: EventStatus.SUBMITTED },
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      startAt: true,
      endAt: true,
      mechanics: true,
      programFlow: true,
      requirements: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      approvals: {
        where: { action: EventApprovalAction.SUBMITTED },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, actor: { select: { name: true } } },
      },
    },
  });

  return events.map((event) => {
    const latestSubmission = event.approvals[0];
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      venue: event.venue,
      startAt: event.startAt,
      endAt: event.endAt,
      mechanics: event.mechanics,
      programFlow: event.programFlow,
      requirements: event.requirements,
      createdByName: event.createdBy.name,
      submittedByName: latestSubmission?.actor.name ?? null,
      submittedAt: latestSubmission?.createdAt ?? event.createdAt,
    };
  });
}

export async function countSubmittedEvents(): Promise<number> {
  return prisma.event.count({ where: { status: EventStatus.SUBMITTED } });
}

export async function getEventById(eventId: string): Promise<EventRow | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      startAt: true,
      endAt: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    startAt: event.startAt,
    endAt: event.endAt,
    organizer: event.createdBy.name,
  };
}

export interface EventAdminRow {
  id: string;
  title: string;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  status: EventStatus;
  capacity: number | null;
  registeredCount: number;
}

export type EventPage = CursorPage<EventAdminRow>;

export interface EventPageQuery {
  search?: string;
  cursor?: string;
  pageSize?: number;
  status?: EventStatus[];
}

export async function getEventPage(query: EventPageQuery = {}): Promise<EventPage> {
  const { search = "", cursor: rawCursor, pageSize, status = [] } = query;
  const resolvedPageSize = resolveCursorPageSize(pageSize);
  const cursor = decodeTimestampCursor(rawCursor);
  const normalizedSearch = search.trim();

  const searchFilter: Prisma.EventWhereInput = normalizedSearch
    ? {
        OR: [
          { title: { contains: normalizedSearch, mode: "insensitive" } },
          { venue: { contains: normalizedSearch, mode: "insensitive" } },
        ],
      }
    : {};

  const cursorFilter: Prisma.EventWhereInput = cursor
    ? {
        OR: [
          { startAt: { gt: cursor.timestamp } },
          { startAt: cursor.timestamp, id: { gt: cursor.id } },
        ],
      }
    : {};

  const events = await prisma.event.findMany({
    where: {
      ...(status.length > 0 ? { status: { in: status } } : {}),
      ...searchFilter,
      ...(cursor ? { AND: [cursorFilter] } : {}),
    },
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    take: resolvedPageSize + 1,
    select: {
      id: true,
      title: true,
      venue: true,
      startAt: true,
      endAt: true,
      status: true,
      capacity: true,
      _count: {
        select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } },
      },
    },
  });

  const hasMore = events.length > resolvedPageSize;
  const page = hasMore ? events.slice(0, resolvedPageSize) : events;
  const last = page.at(-1);

  return {
    rows: page.map((event) => ({
      id: event.id,
      title: event.title,
      venue: event.venue,
      startAt: event.startAt,
      endAt: event.endAt,
      status: event.status,
      capacity: event.capacity,
      registeredCount: event._count.registrations,
    })),
    nextCursor:
      hasMore && last ? encodeTimestampCursor({ timestamp: last.startAt, id: last.id }) : null,
  };
}

export interface EventScanner {
  id: string;
  status: string;
  assigneeName: string;
  assigneeEmail: string;
}

export interface EventApprovalRow {
  id: string;
  action: EventApprovalAction;
  fromStatus: EventStatus;
  toStatus: EventStatus;
  comment: string | null;
  createdAt: Date;
  actorName: string;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  status: EventStatus;
  mechanics: string | null;
  programFlow: string | null;
  requirements: string | null;
  capacity: number | null;
  registrationClosesAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  createdByName: string;
  createdByEmail: string;
  registeredCount: number;
  scanners: EventScanner[];
  approvals: EventApprovalRow[];
}

export async function getEventDetail(eventId: string): Promise<EventDetail | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      startAt: true,
      endAt: true,
      status: true,
      mechanics: true,
      programFlow: true,
      requirements: true,
      capacity: true,
      registrationClosesAt: true,
      publishedAt: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
      _count: {
        select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } },
      },
      tasks: {
        where: { type: TaskType.ATTENDANCE },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          assignee: { select: { name: true, email: true } },
        },
      },
      approvals: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          action: true,
          fromStatus: true,
          toStatus: true,
          comment: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    startAt: event.startAt,
    endAt: event.endAt,
    status: event.status,
    mechanics: event.mechanics,
    programFlow: event.programFlow,
    requirements: event.requirements,
    capacity: event.capacity,
    registrationClosesAt: event.registrationClosesAt,
    publishedAt: event.publishedAt,
    createdAt: event.createdAt,
    createdByName: event.createdBy.name,
    createdByEmail: event.createdBy.email,
    registeredCount: event._count.registrations,
    scanners: event.tasks.map((task) => ({
      id: task.id,
      status: task.status,
      assigneeName: task.assignee.name,
      assigneeEmail: task.assignee.email,
    })),
    approvals: event.approvals.map((approval) => ({
      id: approval.id,
      action: approval.action,
      fromStatus: approval.fromStatus,
      toStatus: approval.toStatus,
      comment: approval.comment,
      createdAt: approval.createdAt,
      actorName: approval.actor.name,
    })),
  };
}

export interface EventForEdit {
  id: string;
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
  status: EventStatus;
}

export async function getEventForEdit(eventId: string): Promise<EventForEdit | null> {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      status: { in: [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      startAt: true,
      endAt: true,
      mechanics: true,
      programFlow: true,
      requirements: true,
      capacity: true,
      registrationClosesAt: true,
      status: true,
    },
  });
}

interface PublishedEventRecord {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  capacity: number | null;
  registrationClosesAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  status: EventStatus;
  createdBy: { name: string };
  _count: { registrations: number };
}

const publishedEventSelect = {
  id: true,
  title: true,
  description: true,
  venue: true,
  startAt: true,
  endAt: true,
  capacity: true,
  registrationClosesAt: true,
  publishedAt: true,
  createdAt: true,
  status: true,
  createdBy: { select: { name: true } },
  _count: {
    select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } },
  },
} satisfies Prisma.EventSelect;

interface RegistrationSummary {
  reference: string;
  status: RegistrationStatus;
}

function buildEventView(
  event: PublishedEventRecord,
  registration: RegistrationSummary | null,
  now: Date,
): EventView {
  const registrationView: EventRegistration | null = registration
    ? {
        reference: registration.reference,
        state: registration.status === RegistrationStatus.REGISTERED ? "registered" : "cancelled",
      }
    : null;

  const studentEvent: StudentEvent = {
    id: event.id,
    title: event.title,
    organizer: event.createdBy.name,
    description: event.description ?? "",
    venue: event.venue,
    startAt: event.startAt.toISOString(),
    endAt: (event.endAt ?? event.startAt).toISOString(),
    registrationOpensAt: (event.publishedAt ?? event.createdAt).toISOString(),
    registrationClosesAt: (event.registrationClosesAt ?? event.startAt).toISOString(),
    capacity: event.capacity,
    seatsTaken: event._count.registrations,
    registration: registrationView,
  };

  return {
    ...studentEvent,
    status: resolveEventStatus(studentEvent, now),
    remainingSeats: getRemainingSeats(studentEvent),
    canCancel: registrationView?.state === "registered" && !isEventStarted(studentEvent, now),
  };
}

export interface PublishedEventQuery {
  studentId?: string;
  now?: Date;
}

export async function getPublishedEvents(query: PublishedEventQuery = {}): Promise<EventView[]> {
  const { studentId, now = new Date() } = query;
  const events = await prisma.event.findMany({
    where: { status: EventStatus.PUBLISHED },
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    select: publishedEventSelect,
  });

  const registrations =
    studentId && events.length > 0
      ? await prisma.registration.findMany({
          where: {
            studentId,
            eventId: { in: events.map((event) => event.id) },
          },
          select: { eventId: true, reference: true, status: true },
        })
      : [];

  const registrationByEvent = new Map(
    registrations.map((registration) => [registration.eventId, registration]),
  );

  return events.map((event) =>
    buildEventView(event, registrationByEvent.get(event.id) ?? null, now),
  );
}

export async function getPublishedEventById(
  eventId: string,
  query: PublishedEventQuery = {},
): Promise<EventView | null> {
  const { studentId, now = new Date() } = query;
  const event = await prisma.event.findFirst({
    where: { id: eventId, status: EventStatus.PUBLISHED },
    select: publishedEventSelect,
  });

  if (!event) return null;

  const registration = studentId
    ? await prisma.registration.findUnique({
        where: { eventId_studentId: { eventId, studentId } },
        select: { reference: true, status: true },
      })
    : null;

  return buildEventView(event, registration, now);
}

export async function getStudentRegistrations(
  studentId: string,
  now: Date = new Date(),
): Promise<EventView[]> {
  const registrations = await prisma.registration.findMany({
    where: {
      studentId,
      event: { status: { in: [EventStatus.PUBLISHED, EventStatus.CANCELLED] } },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      reference: true,
      status: true,
      event: { select: publishedEventSelect },
    },
  });

  return registrations.map((registration) => {
    const event = buildEventView(
      registration.event,
      { reference: registration.reference, status: registration.status },
      now,
    );

    if (registration.event.status !== EventStatus.CANCELLED) return event;

    return {
      ...event,
      registration: event.registration
        ? { ...event.registration, state: "cancelled" as const }
        : null,
      canCancel: false,
    };
  });
}

export interface EventTicketData {
  event: EventView;
  registration: EventRegistration;
}

export async function getRegistrationTicket(
  eventId: string,
  studentId: string,
  now: Date = new Date(),
): Promise<EventTicketData | null> {
  const registration = await prisma.registration.findUnique({
    where: { eventId_studentId: { eventId, studentId } },
    select: {
      reference: true,
      status: true,
      event: { select: publishedEventSelect },
    },
  });

  if (
    !registration ||
    registration.status !== RegistrationStatus.REGISTERED ||
    registration.event.status !== EventStatus.PUBLISHED
  ) {
    return null;
  }

  return {
    event: buildEventView(
      registration.event,
      { reference: registration.reference, status: registration.status },
      now,
    ),
    registration: { reference: registration.reference, state: "registered" },
  };
}

export interface AttendanceEventOption {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  venue: string;
  registeredCount: number;
}

/**
 * Lists published events that have registered students, most recent first.
 * Every officer may monitor attendance for any published event; the page and
 * action guards enforce the `attendance.*` capabilities.
 */
export async function getAttendanceEventOptions(): Promise<AttendanceEventOption[]> {
  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      registrations: { some: { status: RegistrationStatus.REGISTERED } },
    },
    orderBy: [{ startAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      venue: true,
      _count: {
        select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } },
      },
    },
  });

  return events.map(({ _count, ...event }) => ({
    ...event,
    registeredCount: _count.registrations,
  }));
}

export interface AttendanceStats {
  registered: number;
  checkedIn: number;
  notCheckedIn: number;
  todayCheckIns: number;
  completionRate: number;
}

/**
 * Aggregates the selected event's attendance from persisted records only.
 * Check-ins are counted for students with an active registration, so legacy
 * or walk-in attendance rows never inflate the completion rate.
 */
export async function getEventAttendanceStats(eventId: string): Promise<AttendanceStats> {
  const now = new Date();
  const registeredWhere = { eventId, status: RegistrationStatus.REGISTERED };

  const [registered, checkedIn, todayCheckIns] = await Promise.all([
    prisma.registration.count({ where: registeredWhere }),
    prisma.attendance.count({
      where: { eventId, student: { registrations: { some: registeredWhere } } },
    }),
    prisma.attendance.count({
      where: {
        eventId,
        checkedInAt: { gte: getStartOfDay(now), lte: getEndOfDay(now) },
        student: { registrations: { some: registeredWhere } },
      },
    }),
  ]);

  return {
    registered,
    checkedIn,
    notCheckedIn: Math.max(0, registered - checkedIn),
    todayCheckIns,
    completionRate: registered === 0 ? 0 : Math.round((checkedIn / registered) * 100),
  };
}

export interface AttendanceRecordRow {
  id: string;
  eventId: string;
  eventTitle: string;
  studentName: string;
  studentNumber: string | null;
  reference: string | null;
  checkedInAt: Date;
  method: AttendanceMethod;
  recordedByName: string | null;
}

export interface AttendancePageQuery {
  eventId?: string;
  search?: string;
  method?: AttendanceMethod;
  date?: string;
  cursor?: string;
  pageSize?: number;
}

export type AttendancePage = CursorPage<AttendanceRecordRow>;

/**
 * Reads attendance records newest first with optional event, method, day, and
 * text filters. Text search covers student name, student number, and the
 * exact registration reference.
 */
export async function getAttendancePage(query: AttendancePageQuery = {}): Promise<AttendancePage> {
  const { eventId, search = "", method, date, cursor: rawCursor, pageSize } = query;
  const resolvedPageSize = resolveCursorPageSize(pageSize);
  const cursor = decodeTimestampCursor(rawCursor);
  const normalizedSearch = search.trim();
  const conditions: Prisma.AttendanceWhereInput[] = [];

  if (eventId) conditions.push({ eventId });
  if (method) conditions.push({ method });
  if (date) {
    const day = new Date(`${date}T00:00:00`);
    conditions.push({ checkedInAt: { gte: getStartOfDay(day), lte: getEndOfDay(day) } });
  }

  if (normalizedSearch) {
    const referenceMatch = await prisma.registration.findUnique({
      where: { reference: normalizedSearch.toUpperCase() },
      select: { eventId: true, studentId: true },
    });
    conditions.push({
      OR: [
        { student: { name: { contains: normalizedSearch, mode: "insensitive" } } },
        { student: { studentNumber: { contains: normalizedSearch, mode: "insensitive" } } },
        ...(referenceMatch
          ? [{ eventId: referenceMatch.eventId, studentId: referenceMatch.studentId }]
          : []),
      ],
    });
  }

  if (cursor) {
    conditions.push({
      OR: [
        { checkedInAt: { lt: cursor.timestamp } },
        { checkedInAt: cursor.timestamp, id: { lt: cursor.id } },
      ],
    });
  }

  const attendances = await prisma.attendance.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    orderBy: [{ checkedInAt: "desc" }, { id: "desc" }],
    take: resolvedPageSize + 1,
    select: {
      id: true,
      eventId: true,
      studentId: true,
      checkedInAt: true,
      method: true,
      event: { select: { title: true } },
      student: { select: { name: true, studentNumber: true } },
      recordedBy: { select: { name: true } },
    },
  });

  const hasMore = attendances.length > resolvedPageSize;
  const page = hasMore ? attendances.slice(0, resolvedPageSize) : attendances;
  const last = page.at(-1);

  const references =
    page.length > 0
      ? await prisma.registration.findMany({
          where: {
            OR: page.map((row) => ({ eventId: row.eventId, studentId: row.studentId })),
          },
          select: { eventId: true, studentId: true, reference: true },
        })
      : [];
  const referenceByStudent = new Map(
    references.map((registration) => [
      `${registration.eventId}:${registration.studentId}`,
      registration.reference,
    ]),
  );

  return {
    rows: page.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      eventTitle: row.event.title,
      studentName: row.student.name,
      studentNumber: row.student.studentNumber,
      reference: referenceByStudent.get(`${row.eventId}:${row.studentId}`) ?? null,
      checkedInAt: row.checkedInAt,
      method: row.method,
      recordedByName: row.recordedBy?.name ?? null,
    })),
    nextCursor:
      hasMore && last ? encodeTimestampCursor({ timestamp: last.checkedInAt, id: last.id }) : null,
  };
}

export async function getRecentAttendance(
  eventId: string,
  limit = 5,
): Promise<AttendanceRecordRow[]> {
  const page = await getAttendancePage({ eventId, pageSize: limit });
  return page.rows;
}

export interface AttendanceVerification {
  eventId: string;
  eventTitle: string;
  reference: string;
  studentName: string;
  studentNumber: string | null;
  alreadyCheckedInAt: Date | null;
}

export type AttendanceVerificationResult =
  | { ok: true; verification: AttendanceVerification }
  | {
      ok: false;
      reason: "not_found" | "wrong_event" | "not_registered" | "not_published";
    };

/**
 * Resolves a registration reference for officer verification. This only reads
 * records; attendance is written exclusively by `recordAttendance`.
 */
export async function getAttendanceVerification(
  eventId: string,
  reference: string,
): Promise<AttendanceVerificationResult> {
  const registration = await prisma.registration.findUnique({
    where: { reference },
    select: {
      eventId: true,
      studentId: true,
      status: true,
      student: { select: { name: true, studentNumber: true } },
      event: { select: { title: true, status: true } },
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

  const attendance = await prisma.attendance.findUnique({
    where: { eventId_studentId: { eventId, studentId: registration.studentId } },
    select: { checkedInAt: true },
  });

  return {
    ok: true,
    verification: {
      eventId,
      eventTitle: registration.event.title,
      reference,
      studentName: registration.student.name,
      studentNumber: registration.student.studentNumber,
      alreadyCheckedInAt: attendance?.checkedInAt ?? null,
    },
  };
}
