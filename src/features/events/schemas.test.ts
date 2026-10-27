import { describe, expect, it } from "vitest";

import {
  ApproveEventSchema,
  AttendancePageQuerySchema,
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
} from "./schemas";

const eventId = "c111111111111111111111111";
const startAt = "2026-11-12T08:00:00.000Z";
const endAt = "2026-11-12T16:00:00.000Z";

const validEvent = {
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

describe("ApproveEventSchema", () => {
  it("accepts an event id with no comment", () => {
    expect(ApproveEventSchema.safeParse({ eventId }).success).toBe(true);
  });

  it("trims an optional comment", () => {
    const parsed = ApproveEventSchema.parse({ eventId, comment: "  Looks good  " });

    expect(parsed.comment).toBe("Looks good");
  });

  it("rejects an invalid event id", () => {
    expect(ApproveEventSchema.safeParse({ eventId: "not-an-id" }).success).toBe(false);
  });
});

describe("RequestEventRevisionSchema", () => {
  it("requires a non-whitespace comment", () => {
    const result = RequestEventRevisionSchema.safeParse({ eventId, comment: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Comment is required");
  });

  it("accepts and trims a comment", () => {
    const parsed = RequestEventRevisionSchema.parse({
      eventId,
      comment: "  Add the program flow.  ",
    });

    expect(parsed.comment).toBe("Add the program flow.");
  });

  it("rejects a comment over 1000 characters", () => {
    const result = RequestEventRevisionSchema.safeParse({
      eventId,
      comment: "a".repeat(1001),
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateEventSchema", () => {
  it("accepts a complete event and trims text", () => {
    const parsed = CreateEventSchema.parse({
      ...validEvent,
      title: "  Annual Science Fair 2026  ",
      venue: "  Main Gymnasium  ",
    });

    expect(parsed.title).toBe("Annual Science Fair 2026");
    expect(parsed.venue).toBe("Main Gymnasium");
  });

  it("accepts a draft without mechanics, program flow, requirements, capacity, or deadline", () => {
    const result = CreateEventSchema.safeParse({
      title: "Draft event",
      venue: "Room 101",
      startAt,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mechanics).toBeNull();
      expect(result.data.programFlow).toBeNull();
      expect(result.data.requirements).toBeNull();
      expect(result.data.capacity).toBeNull();
      expect(result.data.registrationClosesAt).toBeNull();
      expect(result.data.endAt).toBeNull();
    }
  });

  it.each([
    ["title", { ...validEvent, title: "   " }],
    ["venue", { ...validEvent, venue: "   " }],
    ["startAt", { ...validEvent, startAt: "not-a-date" }],
  ])("rejects a missing or invalid %s", (_field, payload) => {
    expect(CreateEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an end time that is not after the start time", () => {
    const result = CreateEventSchema.safeParse({
      ...validEvent,
      endAt: startAt,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("End time must be after the start time");
  });

  it("rejects a registration deadline after the event starts", () => {
    const result = CreateEventSchema.safeParse({
      ...validEvent,
      registrationClosesAt: "2026-11-12T08:01:00.000Z",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Registration must close on or before the event starts",
    );
  });

  it("rejects a non-positive capacity", () => {
    expect(CreateEventSchema.safeParse({ ...validEvent, capacity: 0 }).success).toBe(false);
  });
});

describe("UpdateEventSchema", () => {
  it("requires the event id", () => {
    expect(UpdateEventSchema.safeParse(validEvent).success).toBe(false);
  });

  it("accepts a valid event id and event fields", () => {
    expect(UpdateEventSchema.safeParse({ eventId, ...validEvent }).success).toBe(true);
  });
});

describe("SubmitEventSchema", () => {
  it("accepts an event id", () => {
    expect(SubmitEventSchema.safeParse({ eventId }).success).toBe(true);
  });

  it("rejects an invalid event id", () => {
    expect(SubmitEventSchema.safeParse({ eventId: "not-an-id" }).success).toBe(false);
  });
});

describe("CancelEventSchema", () => {
  it("accepts an event id", () => {
    expect(CancelEventSchema.safeParse({ eventId }).success).toBe(true);
  });

  it("rejects an invalid event id", () => {
    expect(CancelEventSchema.safeParse({ eventId: "not-an-id" }).success).toBe(false);
  });
});

describe("UnpublishEventSchema", () => {
  it("requires a comment", () => {
    expect(UnpublishEventSchema.safeParse({ eventId, comment: "   " }).success).toBe(false);
  });

  it("accepts a comment", () => {
    expect(UnpublishEventSchema.safeParse({ eventId, comment: "Fix the mechanics." }).success).toBe(
      true,
    );
  });
});

describe("EventPageQuerySchema", () => {
  it("accepts an empty query", () => {
    expect(EventPageQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts a status filter and search", () => {
    const result = EventPageQuerySchema.safeParse({
      search: "  science  ",
      filters: { status: ["PUBLISHED"] },
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.search).toBe("science");
  });

  it("rejects an unknown status filter", () => {
    expect(EventPageQuerySchema.safeParse({ filters: { status: ["ARCHIVED"] } }).success).toBe(
      false,
    );
  });
});

describe("RegisterForEventSchema", () => {
  it("accepts an event id", () => {
    expect(RegisterForEventSchema.safeParse({ eventId }).success).toBe(true);
  });

  it("rejects an invalid event id", () => {
    expect(RegisterForEventSchema.safeParse({ eventId: "not-an-id" }).success).toBe(false);
  });
});

describe("CancelRegistrationSchema", () => {
  it("accepts an event id", () => {
    expect(CancelRegistrationSchema.safeParse({ eventId }).success).toBe(true);
  });

  it("rejects an invalid event id", () => {
    expect(CancelRegistrationSchema.safeParse({ eventId: "not-an-id" }).success).toBe(false);
  });
});

describe("VerifyAttendanceSchema", () => {
  it("accepts an event id and reference, normalizing the reference to uppercase", () => {
    const parsed = VerifyAttendanceSchema.parse({ eventId, reference: "  kasama-abc123  " });

    expect(parsed.reference).toBe("KASAMA-ABC123");
  });

  it("rejects an empty reference", () => {
    expect(VerifyAttendanceSchema.safeParse({ eventId, reference: "   " }).success).toBe(false);
  });

  it("rejects an invalid event id", () => {
    expect(
      VerifyAttendanceSchema.safeParse({ eventId: "not-an-id", reference: "KASAMA-ABC123" })
        .success,
    ).toBe(false);
  });
});

describe("RecordAttendanceSchema", () => {
  it.each([["QR"], ["MANUAL"]])("accepts the %s method", (method) => {
    expect(
      RecordAttendanceSchema.safeParse({ eventId, reference: "KASAMA-ABC123", method }).success,
    ).toBe(true);
  });

  it("rejects an unknown method", () => {
    expect(
      RecordAttendanceSchema.safeParse({
        eventId,
        reference: "KASAMA-ABC123",
        method: "SMS",
      }).success,
    ).toBe(false);
  });
});

describe("AttendancePageQuerySchema", () => {
  it("accepts an empty query", () => {
    expect(AttendancePageQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts event, method, date, and search filters", () => {
    expect(
      AttendancePageQuerySchema.safeParse({
        eventId,
        method: "MANUAL",
        date: "2026-11-12",
        search: "Carlo",
        pageSize: 20,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid date", () => {
    expect(AttendancePageQuerySchema.safeParse({ date: "12/11/2026" }).success).toBe(false);
  });

  it("rejects a page size above 50", () => {
    expect(AttendancePageQuerySchema.safeParse({ pageSize: 51 }).success).toBe(false);
  });
});
