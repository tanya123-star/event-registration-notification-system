import { beforeEach, describe, expect, it, vi } from "vitest";

import { Role } from "@/generated/prisma/browser";
import {
  actionConflict,
  actionError,
  actionForbidden,
  actionInvalid,
  actionNotFound,
} from "@/lib/security/action-response";
import { ForbiddenError } from "@/lib/security/errors";

import {
  approveEventAction,
  cancelEventAction,
  cancelRegistrationAction,
  createEventAction,
  getEventPageAction,
  recordAttendanceAction,
  registerForEventAction,
  requestEventRevisionAction,
  submitEventAction,
  unpublishEventAction,
  updateEventAction,
  verifyAttendanceAction,
} from "./actions";

const guards = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const mutations = vi.hoisted(() => ({
  approveEvent: vi.fn(),
  requestEventRevision: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  submitEvent: vi.fn(),
  cancelEvent: vi.fn(),
  createRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
  recordAttendance: vi.fn(),
}));

const queries = vi.hoisted(() => ({
  getEventPage: vi.fn(),
  getAttendanceVerification: vi.fn(),
}));

vi.mock("@/lib/security/auth-guards", () => ({
  requirePermission: guards.requirePermission,
}));

vi.mock("./mutations", () => ({
  approveEvent: mutations.approveEvent,
  requestEventRevision: mutations.requestEventRevision,
  createEvent: mutations.createEvent,
  updateEvent: mutations.updateEvent,
  submitEvent: mutations.submitEvent,
  cancelEvent: mutations.cancelEvent,
  createRegistration: mutations.createRegistration,
  cancelRegistration: mutations.cancelRegistration,
  recordAttendance: mutations.recordAttendance,
}));

vi.mock("./queries", () => ({
  getEventPage: queries.getEventPage,
  getAttendanceVerification: queries.getAttendanceVerification,
}));

const actor = {
  id: "c222222222222222222222222",
  email: "admin@acdeducation.com",
  name: "Admin",
  role: Role.ADMIN,
  isActive: true,
  officerPosition: null,
};

const eventId = "c111111111111111111111111";
const startAt = "2026-11-12T08:00:00.000Z";
const endAt = "2026-11-12T16:00:00.000Z";

const eventPayload = {
  title: "Annual Science Fair 2026",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt,
  endAt,
  mechanics: "Doors open at 7:30 AM.",
  programFlow: "Opening remarks, exhibits, closing.",
  requirements: "Bring your student ID.",
  capacity: 400,
  registrationClosesAt: "2026-11-10T17:00:00.000Z",
};

beforeEach(() => {
  guards.requirePermission.mockReset();
  mutations.approveEvent.mockReset();
  mutations.requestEventRevision.mockReset();
  mutations.createEvent.mockReset();
  mutations.updateEvent.mockReset();
  mutations.submitEvent.mockReset();
  mutations.cancelEvent.mockReset();
  mutations.createRegistration.mockReset();
  mutations.cancelRegistration.mockReset();
  mutations.recordAttendance.mockReset();
  queries.getEventPage.mockReset();
  queries.getAttendanceVerification.mockReset();
  guards.requirePermission.mockResolvedValue(actor);
  mutations.approveEvent.mockResolvedValue({ ok: true, status: "PUBLISHED" });
  mutations.requestEventRevision.mockResolvedValue({ ok: true, status: "REVISION_REQUESTED" });
  mutations.createEvent.mockResolvedValue({ ok: true, eventId });
  mutations.updateEvent.mockResolvedValue({ ok: true, eventId });
  mutations.submitEvent.mockResolvedValue({ ok: true, status: "SUBMITTED" });
  mutations.cancelEvent.mockResolvedValue({ ok: true, status: "CANCELLED" });
  mutations.createRegistration.mockResolvedValue({ ok: true, reference: "KASAMA-ABC123" });
  mutations.cancelRegistration.mockResolvedValue({ ok: true });
});

describe("approveEventAction", () => {
  it("approves as the signed-in actor", async () => {
    await expect(approveEventAction({ eventId })).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.approve");
    expect(mutations.approveEvent).toHaveBeenCalledWith({
      eventId,
      actorId: actor.id,
      comment: undefined,
    });
  });

  it("rejects an invalid event id before writing", async () => {
    await expect(approveEventAction({ eventId: "not-an-id" })).resolves.toEqual({
      success: false,
      error: {
        code: "validation",
        title: "Invalid event approval data",
        description: "Some fields are missing or malformed. Review your input and try again.",
      },
    });
    expect(mutations.approveEvent).not.toHaveBeenCalled();
  });

  it("returns a conflict when the event was already reviewed", async () => {
    mutations.approveEvent.mockResolvedValue({ ok: false, reason: "not_submitted" });

    await expect(approveEventAction({ eventId })).resolves.toEqual({
      success: false,
      error: {
        code: "conflict",
        title: "Event is not awaiting approval",
        description:
          "Another administrator may have already reviewed it. Refresh the queue and try again.",
      },
    });
  });

  it("returns not found for a missing event", async () => {
    mutations.approveEvent.mockResolvedValue({ ok: false, reason: "not_found" });

    await expect(approveEventAction({ eventId })).resolves.toEqual(actionNotFound("Event"));
  });

  it("returns the forbidden envelope when the caller lacks event.approve", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(approveEventAction({ eventId })).resolves.toEqual(actionForbidden());
    expect(mutations.approveEvent).not.toHaveBeenCalled();
  });
});

describe("requestEventRevisionAction", () => {
  it("requests revision as the signed-in actor with the trimmed comment", async () => {
    await expect(
      requestEventRevisionAction({ eventId, comment: "  Add the program flow.  " }),
    ).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.approve");
    expect(mutations.requestEventRevision).toHaveBeenCalledWith({
      eventId,
      actorId: actor.id,
      comment: "Add the program flow.",
    });
  });

  it("rejects a missing comment before writing", async () => {
    await expect(requestEventRevisionAction({ eventId, comment: "   " })).resolves.toEqual({
      success: false,
      error: {
        code: "validation",
        title: "Invalid event revision data",
        description: "Some fields are missing or malformed. Review your input and try again.",
      },
    });
    expect(mutations.requestEventRevision).not.toHaveBeenCalled();
  });

  it("returns a conflict when the event is no longer reviewable", async () => {
    mutations.requestEventRevision.mockResolvedValue({ ok: false, reason: "not_reviewable" });

    await expect(
      requestEventRevisionAction({ eventId, comment: "Add the program flow." }),
    ).resolves.toEqual(
      actionConflict(
        "Event cannot be sent for revision",
        "Only submitted or published events can be sent back for revision.",
      ),
    );
  });

  it("returns the forbidden envelope when the caller lacks event.approve", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(
      requestEventRevisionAction({ eventId, comment: "Add the program flow." }),
    ).resolves.toEqual(actionForbidden());
    expect(mutations.requestEventRevision).not.toHaveBeenCalled();
  });
});

describe("getEventPageAction", () => {
  it("reads the event page for an event reader", async () => {
    const page = { rows: [], nextCursor: null };
    queries.getEventPage.mockResolvedValue(page);

    await expect(
      getEventPageAction({
        search: "  science  ",
        filters: { status: ["PUBLISHED"] },
      }),
    ).resolves.toEqual(page);

    expect(guards.requirePermission).toHaveBeenCalledWith("event.read_all");
    expect(queries.getEventPage).toHaveBeenCalledWith({
      search: "science",
      cursor: undefined,
      pageSize: undefined,
      status: ["PUBLISHED"],
    });
  });

  it("throws on an invalid status filter", async () => {
    await expect(getEventPageAction({ filters: { status: ["ARCHIVED"] } })).rejects.toThrow(
      "Invalid query parameters",
    );
  });
});

describe("createEventAction", () => {
  it("creates a draft as the signed-in actor", async () => {
    await expect(createEventAction(eventPayload)).resolves.toEqual({
      success: true,
      data: { eventId },
    });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.create");
    expect(mutations.createEvent).toHaveBeenCalledWith({
      ...eventPayload,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      registrationClosesAt: new Date("2026-11-10T17:00:00.000Z"),
      createdById: actor.id,
    });
  });

  it("rejects invalid event fields before writing", async () => {
    await expect(createEventAction({ ...eventPayload, title: "   " })).resolves.toEqual({
      success: false,
      error: {
        code: "validation",
        title: "Invalid event data",
        description: "Some fields are missing or malformed. Review your input and try again.",
      },
    });
    expect(mutations.createEvent).not.toHaveBeenCalled();
  });

  it("returns the forbidden envelope when the caller lacks event.create", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(createEventAction(eventPayload)).resolves.toEqual(actionForbidden());
    expect(mutations.createEvent).not.toHaveBeenCalled();
  });
});

describe("updateEventAction", () => {
  it("updates an editable event", async () => {
    await expect(updateEventAction({ eventId, ...eventPayload })).resolves.toEqual({
      success: true,
      data: { eventId },
    });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.edit");
    expect(mutations.updateEvent).toHaveBeenCalledWith({
      eventId,
      ...eventPayload,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      registrationClosesAt: new Date("2026-11-10T17:00:00.000Z"),
    });
  });

  it("returns a conflict when the event is no longer editable", async () => {
    mutations.updateEvent.mockResolvedValue({ ok: false, reason: "not_editable" });

    await expect(updateEventAction({ eventId, ...eventPayload })).resolves.toEqual(
      actionConflict(
        "Event can no longer be edited",
        "Only drafts and revision requests can be edited.",
      ),
    );
  });

  it("returns not found for a missing event", async () => {
    mutations.updateEvent.mockResolvedValue({ ok: false, reason: "not_found" });

    await expect(updateEventAction({ eventId, ...eventPayload })).resolves.toEqual(
      actionNotFound("Event"),
    );
  });
});

describe("submitEventAction", () => {
  it("submits as the signed-in actor", async () => {
    await expect(submitEventAction({ eventId })).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.submit");
    expect(mutations.submitEvent).toHaveBeenCalledWith({ eventId, actorId: actor.id });
  });

  it("returns a conflict when the event cannot be submitted", async () => {
    mutations.submitEvent.mockResolvedValue({ ok: false, reason: "not_submittable" });

    await expect(submitEventAction({ eventId })).resolves.toEqual(
      actionConflict(
        "Event cannot be submitted",
        "Only drafts and revision requests can be submitted for approval.",
      ),
    );
  });

  it("returns validation details when required fields are missing", async () => {
    mutations.submitEvent.mockResolvedValue({ ok: false, reason: "missing_details" });

    await expect(submitEventAction({ eventId })).resolves.toEqual(
      actionError(
        "validation",
        "Event is missing required details",
        "Add the mechanics, program flow, and requirements before submitting.",
      ),
    );
  });

  it("returns not found for a missing event", async () => {
    mutations.submitEvent.mockResolvedValue({ ok: false, reason: "not_found" });

    await expect(submitEventAction({ eventId })).resolves.toEqual(actionNotFound("Event"));
  });
});

describe("cancelEventAction", () => {
  it("cancels as the signed-in actor", async () => {
    await expect(cancelEventAction({ eventId })).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.cancel");
    expect(mutations.cancelEvent).toHaveBeenCalledWith({ eventId, actorId: actor.id });
  });

  it("returns a conflict when the event is already cancelled", async () => {
    mutations.cancelEvent.mockResolvedValue({ ok: false, reason: "already_cancelled" });

    await expect(cancelEventAction({ eventId })).resolves.toEqual(
      actionConflict("Event is already cancelled", "Refresh the page to see the latest status."),
    );
  });

  it("returns not found for a missing event", async () => {
    mutations.cancelEvent.mockResolvedValue({ ok: false, reason: "not_found" });

    await expect(cancelEventAction({ eventId })).resolves.toEqual(actionNotFound("Event"));
  });
});

describe("unpublishEventAction", () => {
  it("sends a published event back for revision with the trimmed comment", async () => {
    await expect(
      unpublishEventAction({ eventId, comment: "  Fix the mechanics.  " }),
    ).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("event.approve");
    expect(mutations.requestEventRevision).toHaveBeenCalledWith({
      eventId,
      actorId: actor.id,
      comment: "Fix the mechanics.",
    });
  });

  it("rejects a missing comment", async () => {
    await expect(unpublishEventAction({ eventId, comment: "   " })).resolves.toEqual({
      success: false,
      error: {
        code: "validation",
        title: "Invalid event unpublish data",
        description: "Some fields are missing or malformed. Review your input and try again.",
      },
    });
  });

  it("returns a conflict when the event cannot be unpublished", async () => {
    mutations.requestEventRevision.mockResolvedValue({ ok: false, reason: "not_reviewable" });

    await expect(unpublishEventAction({ eventId, comment: "Fix the mechanics." })).resolves.toEqual(
      actionConflict(
        "Event cannot be unpublished",
        "Only submitted or published events can be sent back for revision.",
      ),
    );
  });
});

describe("registerForEventAction", () => {
  it("registers the signed-in student", async () => {
    await expect(registerForEventAction({ eventId })).resolves.toEqual({
      success: true,
      data: { reference: "KASAMA-ABC123" },
    });

    expect(guards.requirePermission).toHaveBeenCalledWith("registration.create");
    expect(mutations.createRegistration).toHaveBeenCalledWith({
      eventId,
      studentId: actor.id,
    });
  });

  it.each([
    ["not_found", actionNotFound("Event")],
    [
      "not_published",
      actionConflict(
        "Event is not open for registration",
        "It may have been unpublished or cancelled.",
      ),
    ],
    ["started", actionConflict("Registration has closed", "This event has already started.")],
    ["closed", actionConflict("Registration has closed", "The registration deadline has passed.")],
    [
      "full",
      actionConflict(
        "Event is full",
        "All seats are taken. Try another event or check back later.",
      ),
    ],
    [
      "already_registered",
      actionConflict("You're already registered", "Open My Registrations to view your ticket."),
    ],
  ])("maps %s to its envelope", async (reason, expected) => {
    mutations.createRegistration.mockResolvedValue({ ok: false, reason });

    await expect(registerForEventAction({ eventId })).resolves.toEqual(expected);
  });

  it("returns the forbidden envelope when the caller lacks registration.create", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(registerForEventAction({ eventId })).resolves.toEqual(actionForbidden());
  });
});

describe("cancelRegistrationAction", () => {
  it("cancels the signed-in student's registration", async () => {
    await expect(cancelRegistrationAction({ eventId })).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("registration.cancel");
    expect(mutations.cancelRegistration).toHaveBeenCalledWith({
      eventId,
      studentId: actor.id,
    });
  });

  it.each([
    ["not_found", actionNotFound("Registration")],
    [
      "not_registered",
      actionConflict("Registration is not active", "It may have already been cancelled."),
    ],
    [
      "started",
      actionConflict("Registration can no longer be cancelled", "The event has already started."),
    ],
    [
      "attended",
      actionConflict(
        "Attendance is already recorded",
        "Contact a KASAMA officer if you need help.",
      ),
    ],
  ])("maps %s to its envelope", async (reason, expected) => {
    mutations.cancelRegistration.mockResolvedValue({ ok: false, reason });

    await expect(cancelRegistrationAction({ eventId })).resolves.toEqual(expected);
  });
});

describe("verifyAttendanceAction", () => {
  const payload = { eventId, reference: "KASAMA-ABC123" };
  const verification = {
    eventId,
    eventTitle: "Annual Science Fair 2026",
    reference: "KASAMA-ABC123",
    studentName: "Maria Santos",
    studentNumber: "20260001",
    alreadyCheckedInAt: null,
  };

  it("returns the verified student summary", async () => {
    queries.getAttendanceVerification.mockResolvedValue({ ok: true, verification });

    await expect(verifyAttendanceAction(payload)).resolves.toEqual({
      success: true,
      data: verification,
    });
    expect(guards.requirePermission).toHaveBeenCalledWith("attendance.scan", "attendance.manual");
  });

  it("maps an unknown reference to a not-found envelope", async () => {
    queries.getAttendanceVerification.mockResolvedValue({ ok: false, reason: "not_found" });

    await expect(verifyAttendanceAction(payload)).resolves.toEqual(
      actionError(
        "not_found",
        "Reference not found",
        "No registration matches this reference. Check the code and try again.",
      ),
    );
  });

  it("maps a reference from another event to a conflict envelope", async () => {
    queries.getAttendanceVerification.mockResolvedValue({ ok: false, reason: "wrong_event" });

    await expect(verifyAttendanceAction(payload)).resolves.toEqual(
      actionConflict(
        "Reference belongs to another event",
        "Switch to the event this student registered for, then try again.",
      ),
    );
  });

  it("rejects an empty reference before querying", async () => {
    await expect(verifyAttendanceAction({ eventId, reference: "   " })).resolves.toEqual(
      actionInvalid("attendance reference"),
    );
    expect(queries.getAttendanceVerification).not.toHaveBeenCalled();
  });

  it("returns the forbidden envelope when the caller lacks attendance permissions", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(verifyAttendanceAction(payload)).resolves.toEqual(actionForbidden());
  });
});

describe("recordAttendanceAction", () => {
  const checkedInAt = new Date("2026-11-12T08:30:00+08:00");
  const payload = { eventId, reference: "KASAMA-ABC123", method: "MANUAL" as const };

  it("records attendance for the signed-in officer", async () => {
    mutations.recordAttendance.mockResolvedValue({ ok: true, checkedInAt });

    await expect(recordAttendanceAction(payload)).resolves.toEqual({
      success: true,
      data: { checkedInAt },
    });
    expect(mutations.recordAttendance).toHaveBeenCalledWith({
      eventId,
      reference: "KASAMA-ABC123",
      method: "MANUAL",
      recordedById: actor.id,
    });
  });

  it("maps a duplicate check-in to a conflict envelope", async () => {
    mutations.recordAttendance.mockResolvedValue({ ok: false, reason: "already_attended" });

    await expect(recordAttendanceAction(payload)).resolves.toEqual(
      actionConflict(
        "Already checked in",
        "Attendance for this student was already recorded for this event.",
      ),
    );
  });

  it("maps a cancelled registration to a conflict envelope", async () => {
    mutations.recordAttendance.mockResolvedValue({ ok: false, reason: "not_registered" });

    await expect(recordAttendanceAction(payload)).resolves.toEqual(
      actionConflict(
        "Registration is not active",
        "This registration was cancelled, so attendance cannot be recorded.",
      ),
    );
  });

  it("rejects an invalid payload before writing", async () => {
    await expect(
      recordAttendanceAction({ eventId: "not-an-id", reference: "KASAMA-ABC123", method: "QR" }),
    ).resolves.toEqual(actionInvalid("attendance"));
    expect(mutations.recordAttendance).not.toHaveBeenCalled();
  });

  it("returns the forbidden envelope when the caller lacks attendance permissions", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(recordAttendanceAction(payload)).resolves.toEqual(actionForbidden());
  });
});
