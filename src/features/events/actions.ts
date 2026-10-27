"use server";

import type { PageQuery } from "@/lib/primitives/types";
import {
  actionConflict,
  actionError,
  actionInvalid,
  actionNotFound,
  type ActionDataResponse,
  type ActionStatusResponse,
} from "@/lib/security/action-response";
import { requirePermission } from "@/lib/security/auth-guards";
import { toActionResponse } from "@/lib/security/errors";

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
import {
  getAttendanceVerification,
  getEventPage,
  type AttendanceVerification,
  type EventPage,
} from "./queries";
import {
  ApproveEventSchema,
  CancelEventSchema,
  CancelRegistrationSchema,
  CreateEventSchema,
  EventPageQuerySchema,
  RecordAttendanceSchema,
  RegisterForEventSchema,
  RequestEventRevisionSchema,
  SubmitEventSchema,
  UnpublishEventSchema,
  UpdateEventSchema,
  VerifyAttendanceSchema,
  type ApproveEventPayload,
  type CancelEventPayload,
  type CancelRegistrationPayload,
  type CreateEventPayload,
  type RecordAttendancePayload,
  type RegisterForEventPayload,
  type RequestEventRevisionPayload,
  type SubmitEventPayload,
  type UnpublishEventPayload,
  type UpdateEventPayload,
  type VerifyAttendancePayload,
} from "./schemas";

function approvalFailure(reason: "not_found" | "not_submitted"): ActionStatusResponse {
  if (reason === "not_found") return actionNotFound("Event");
  return actionConflict(
    "Event is not awaiting approval",
    "Another administrator may have already reviewed it. Refresh the queue and try again.",
  );
}

function revisionFailure(reason: "not_found" | "not_reviewable"): ActionStatusResponse {
  if (reason === "not_found") return actionNotFound("Event");
  return actionConflict(
    "Event cannot be sent for revision",
    "Only submitted or published events can be sent back for revision.",
  );
}

function writeFailure(reason: "not_found" | "not_editable"): ActionStatusResponse {
  if (reason === "not_found") return actionNotFound("Event");
  return actionConflict(
    "Event can no longer be edited",
    "Only drafts and revision requests can be edited.",
  );
}

function submitFailure(
  reason: "not_found" | "not_submittable" | "missing_details",
): ActionStatusResponse {
  if (reason === "not_found") return actionNotFound("Event");
  if (reason === "missing_details") {
    return actionError(
      "validation",
      "Event is missing required details",
      "Add the mechanics, program flow, and requirements before submitting.",
    );
  }
  return actionConflict(
    "Event cannot be submitted",
    "Only drafts and revision requests can be submitted for approval.",
  );
}

function cancelFailure(reason: "not_found" | "already_cancelled"): ActionStatusResponse {
  if (reason === "not_found") return actionNotFound("Event");
  return actionConflict("Event is already cancelled", "Refresh the page to see the latest status.");
}

function registrationCreateFailure(
  reason: "not_found" | "not_published" | "started" | "closed" | "full" | "already_registered",
): ActionStatusResponse {
  switch (reason) {
    case "not_found":
      return actionNotFound("Event");
    case "not_published":
      return actionConflict(
        "Event is not open for registration",
        "It may have been unpublished or cancelled.",
      );
    case "started":
      return actionConflict("Registration has closed", "This event has already started.");
    case "closed":
      return actionConflict("Registration has closed", "The registration deadline has passed.");
    case "full":
      return actionConflict(
        "Event is full",
        "All seats are taken. Try another event or check back later.",
      );
    case "already_registered":
      return actionConflict(
        "You're already registered",
        "Open My Registrations to view your ticket.",
      );
  }
}

function registrationCancelFailure(
  reason: "not_found" | "not_registered" | "started" | "attended",
): ActionStatusResponse {
  switch (reason) {
    case "not_found":
      return actionNotFound("Registration");
    case "not_registered":
      return actionConflict("Registration is not active", "It may have already been cancelled.");
    case "started":
      return actionConflict(
        "Registration can no longer be cancelled",
        "The event has already started.",
      );
    case "attended":
      return actionConflict(
        "Attendance is already recorded",
        "Contact a KASAMA officer if you need help.",
      );
  }
}

/**
 * Approves a submitted event, publishing it immediately and recording the actor.
 *
 * @param payload - The event id and an optional approval comment.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.approve`.
 */
export async function approveEventAction(
  payload: ApproveEventPayload,
): Promise<ActionStatusResponse> {
  try {
    const actor = await requirePermission("event.approve");
    const parsed = ApproveEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event approval");
    const result = await approveEvent({
      eventId: parsed.data.eventId,
      actorId: actor.id,
      comment: parsed.data.comment,
    });
    if (!result.ok) return approvalFailure(result.reason);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "approve event");
  }
}

/**
 * Sends a submitted or published event back for revision with a required comment.
 *
 * @param payload - The event id and the revision comment.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.approve`.
 */
export async function requestEventRevisionAction(
  payload: RequestEventRevisionPayload,
): Promise<ActionStatusResponse> {
  try {
    const actor = await requirePermission("event.approve");
    const parsed = RequestEventRevisionSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event revision");
    const result = await requestEventRevision({
      eventId: parsed.data.eventId,
      actorId: actor.id,
      comment: parsed.data.comment,
    });
    if (!result.ok) return revisionFailure(result.reason);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "request event revision");
  }
}

/**
 * Unpublishes a published event by sending it back for revision.
 *
 * @param payload - The event id and the required unpublish comment.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.approve`.
 */
export async function unpublishEventAction(
  payload: UnpublishEventPayload,
): Promise<ActionStatusResponse> {
  try {
    const actor = await requirePermission("event.approve");
    const parsed = UnpublishEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event unpublish");
    const result = await requestEventRevision({
      eventId: parsed.data.eventId,
      actorId: actor.id,
      comment: parsed.data.comment,
    });
    if (!result.ok) {
      if (result.reason === "not_reviewable") {
        return actionConflict(
          "Event cannot be unpublished",
          "Only submitted or published events can be sent back for revision.",
        );
      }
      return actionNotFound("Event");
    }
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "unpublish event");
  }
}

/**
 * Reads one cursor page of events for the admin event list.
 *
 * @param query - Search, cursor, page size, and status filters.
 * @returns The matching event rows and the next cursor.
 * @throws {ForbiddenError} When the caller lacks `event.read_all`.
 */
export async function getEventPageAction(query: PageQuery): Promise<EventPage> {
  await requirePermission("event.read_all");
  const parsed = EventPageQuerySchema.safeParse(query);
  if (!parsed.success) throw new Error("Invalid query parameters");
  return getEventPage({
    search: parsed.data.search,
    cursor: parsed.data.cursor,
    pageSize: parsed.data.pageSize,
    status: parsed.data.filters?.status,
  });
}

/**
 * Creates a draft event owned by the signed-in user.
 *
 * @param payload - The event fields and optional capacity/deadline.
 * @returns The created event id, or an invalid/forbidden envelope.
 * @throws {ForbiddenError} When the caller lacks `event.create`.
 */
export async function createEventAction(
  payload: CreateEventPayload,
): Promise<ActionDataResponse<{ eventId: string }>> {
  try {
    const actor = await requirePermission("event.create");
    const parsed = CreateEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event");
    const result = await createEvent({
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      registrationClosesAt: parsed.data.registrationClosesAt
        ? new Date(parsed.data.registrationClosesAt)
        : null,
      createdById: actor.id,
    });
    if (!result.ok) return writeFailure(result.reason);
    return { success: true, data: { eventId: result.eventId } };
  } catch (error) {
    return toActionResponse(error, "create event");
  }
}

/**
 * Updates a draft or revision-requested event.
 *
 * @param payload - The event id and editable event fields.
 * @returns The updated event id, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.edit`.
 */
export async function updateEventAction(
  payload: UpdateEventPayload,
): Promise<ActionDataResponse<{ eventId: string }>> {
  try {
    await requirePermission("event.edit");
    const parsed = UpdateEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event");
    const result = await updateEvent({
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      registrationClosesAt: parsed.data.registrationClosesAt
        ? new Date(parsed.data.registrationClosesAt)
        : null,
    });
    if (!result.ok) return writeFailure(result.reason);
    return { success: true, data: { eventId: result.eventId } };
  } catch (error) {
    return toActionResponse(error, "update event");
  }
}

/**
 * Submits a draft or revision-requested event for approval.
 *
 * @param payload - The event id.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.submit`.
 */
export async function submitEventAction(
  payload: SubmitEventPayload,
): Promise<ActionStatusResponse> {
  try {
    const actor = await requirePermission("event.submit");
    const parsed = SubmitEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event submission");
    const result = await submitEvent({ eventId: parsed.data.eventId, actorId: actor.id });
    if (!result.ok) return submitFailure(result.reason);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "submit event");
  }
}

/**
 * Cancels an event and records the cancellation in its approval trail.
 *
 * @param payload - The event id.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.cancel`.
 */
export async function cancelEventAction(
  payload: CancelEventPayload,
): Promise<ActionStatusResponse> {
  try {
    const actor = await requirePermission("event.cancel");
    const parsed = CancelEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event cancellation");
    const result = await cancelEvent({ eventId: parsed.data.eventId, actorId: actor.id });
    if (!result.ok) return cancelFailure(result.reason);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "cancel event");
  }
}

/**
 * Registers the signed-in student for a published event.
 *
 * @param payload - The event id.
 * @returns The opaque registration reference, or a conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `registration.create`.
 */
export async function registerForEventAction(
  payload: RegisterForEventPayload,
): Promise<ActionDataResponse<{ reference: string }>> {
  try {
    const actor = await requirePermission("registration.create");
    const parsed = RegisterForEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("registration");
    const result = await createRegistration({
      eventId: parsed.data.eventId,
      studentId: actor.id,
    });
    if (!result.ok) return registrationCreateFailure(result.reason);
    return { success: true, data: { reference: result.reference } };
  } catch (error) {
    return toActionResponse(error, "register for event");
  }
}

/**
 * Cancels the signed-in student's active registration.
 *
 * @param payload - The event id.
 * @returns `success: true`, or a not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `registration.cancel`.
 */
export async function cancelRegistrationAction(
  payload: CancelRegistrationPayload,
): Promise<ActionStatusResponse> {
  try {
    const actor = await requirePermission("registration.cancel");
    const parsed = CancelRegistrationSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("registration cancellation");
    const result = await cancelRegistration({
      eventId: parsed.data.eventId,
      studentId: actor.id,
    });
    if (!result.ok) return registrationCancelFailure(result.reason);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "cancel registration");
  }
}

function attendanceVerificationFailure(
  reason: "not_found" | "wrong_event" | "not_registered" | "not_published",
): ActionStatusResponse {
  switch (reason) {
    case "not_found":
      return actionError(
        "not_found",
        "Reference not found",
        "No registration matches this reference. Check the code and try again.",
      );
    case "wrong_event":
      return actionConflict(
        "Reference belongs to another event",
        "Switch to the event this student registered for, then try again.",
      );
    case "not_registered":
      return actionConflict(
        "Registration is not active",
        "This registration was cancelled, so attendance cannot be recorded.",
      );
    case "not_published":
      return actionConflict(
        "Event is not open",
        "Attendance can only be recorded for published events.",
      );
  }
}

function attendanceRecordFailure(
  reason: "not_found" | "wrong_event" | "not_registered" | "not_published" | "already_attended",
): ActionStatusResponse {
  if (reason === "already_attended") {
    return actionConflict(
      "Already checked in",
      "Attendance for this student was already recorded for this event.",
    );
  }
  return attendanceVerificationFailure(reason);
}

/**
 * Resolves a scanned or manually entered registration reference for the
 * selected event without recording attendance.
 *
 * @param payload - The selected event id and registration reference.
 * @returns The verified student and event summary, or a failure envelope.
 * @throws {ForbiddenError} When the caller lacks `attendance.scan` and
 *                          `attendance.manual`.
 */
export async function verifyAttendanceAction(
  payload: VerifyAttendancePayload,
): Promise<ActionDataResponse<AttendanceVerification>> {
  try {
    await requirePermission("attendance.scan", "attendance.manual");
    const parsed = VerifyAttendanceSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("attendance reference");
    const result = await getAttendanceVerification(parsed.data.eventId, parsed.data.reference);
    if (!result.ok) return attendanceVerificationFailure(result.reason);
    return { success: true, data: result.verification };
  } catch (error) {
    return toActionResponse(error, "verify attendance");
  }
}

/**
 * Records attendance after officer verification.
 *
 * @param payload - The selected event id, registration reference, and entry
 *                  method (`QR` from the camera, `MANUAL` from the form).
 * @returns The persisted check-in time, or a failure envelope.
 * @throws {ForbiddenError} When the caller lacks `attendance.scan` and
 *                          `attendance.manual`.
 */
export async function recordAttendanceAction(
  payload: RecordAttendancePayload,
): Promise<ActionDataResponse<{ checkedInAt: Date }>> {
  try {
    const actor = await requirePermission("attendance.scan", "attendance.manual");
    const parsed = RecordAttendanceSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("attendance");
    const result = await recordAttendance({
      eventId: parsed.data.eventId,
      reference: parsed.data.reference,
      method: parsed.data.method,
      recordedById: actor.id,
    });
    if (!result.ok) return attendanceRecordFailure(result.reason);
    return { success: true, data: { checkedInAt: result.checkedInAt } };
  } catch (error) {
    return toActionResponse(error, "record attendance");
  }
}
