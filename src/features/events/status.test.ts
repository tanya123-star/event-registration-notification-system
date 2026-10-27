import { describe, expect, it } from "vitest";

import { getRemainingSeats, resolveEventStatus } from "./status";
import type { StudentEvent } from "./types";

const baseEvent: StudentEvent = {
  id: "annual-science-fair-2026",
  title: "Annual Science Fair 2026",
  organizer: "KASAMA",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt: "2026-11-12T08:00:00+08:00",
  endAt: "2026-11-12T16:00:00+08:00",
  registrationOpensAt: "2026-10-19T08:00:00+08:00",
  registrationClosesAt: "2026-11-10T17:00:00+08:00",
  capacity: 400,
  seatsTaken: 280,
  registration: null,
  mockReference: "CH-2026-00418",
};

describe("getRemainingSeats", () => {
  it("returns the available seats", () => {
    expect(getRemainingSeats(baseEvent)).toBe(120);
  });

  it("clamps at zero when over capacity", () => {
    expect(getRemainingSeats({ ...baseEvent, seatsTaken: 401 })).toBe(0);
  });

  it("treats a null capacity as unlimited", () => {
    const unlimitedEvent = { ...baseEvent, capacity: null, seatsTaken: 401 };

    expect(getRemainingSeats(unlimitedEvent)).toBeNull();
    expect(resolveEventStatus(unlimitedEvent, "2026-10-22T00:00:00+08:00")).toBe("open");
  });
});

describe("resolveEventStatus", () => {
  it("returns registered before closed or full", () => {
    expect(
      resolveEventStatus(
        {
          ...baseEvent,
          seatsTaken: 400,
          registration: { reference: "CH-2026-00418", state: "registered" },
        },
        "2026-11-11T00:00:00+08:00",
      ),
    ).toBe("registered");
  });

  it.each([
    ["closed after the registration deadline", "2026-11-11T00:00:00+08:00", 280, "closed"],
    ["closed after the event starts", "2026-11-12T08:00:00+08:00", 280, "closed"],
    ["full at capacity", "2026-10-22T00:00:00+08:00", 400, "full"],
    ["open with seats and time left", "2026-10-22T00:00:00+08:00", 280, "open"],
  ] as const)("%s", (_label, now, seatsTaken, expected) => {
    expect(resolveEventStatus({ ...baseEvent, seatsTaken }, now)).toBe(expected);
  });
});
