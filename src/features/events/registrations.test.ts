import { describe, expect, it } from "vitest";

import { getRegistrationGroups } from "./registrations";
import type { EventView } from "./types";

const baseEvent: EventView = {
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
  registration: { reference: "CH-2026-00418", state: "registered" },
  mockReference: "CH-2026-00418",
  status: "registered",
  remainingSeats: 120,
  canCancel: true,
};

describe("getRegistrationGroups", () => {
  it("puts a registered event that has not started in upcoming", () => {
    const groups = getRegistrationGroups([baseEvent], "2026-10-22T00:00:00+08:00");

    expect(groups.upcoming).toEqual([baseEvent]);
    expect(groups.past).toEqual([]);
    expect(groups.cancelled).toEqual([]);
  });

  it("puts a registered event that has started in past", () => {
    const groups = getRegistrationGroups([baseEvent], "2026-11-12T08:00:00+08:00");

    expect(groups.upcoming).toEqual([]);
    expect(groups.past).toEqual([baseEvent]);
    expect(groups.cancelled).toEqual([]);
  });

  it("keeps cancelled registrations in cancelled even before the event starts", () => {
    const cancelled: EventView = {
      ...baseEvent,
      registration: { reference: "CH-2026-00418", state: "cancelled" },
    };

    const groups = getRegistrationGroups([cancelled], "2026-10-22T00:00:00+08:00");

    expect(groups.upcoming).toEqual([]);
    expect(groups.past).toEqual([]);
    expect(groups.cancelled).toEqual([cancelled]);
  });

  it("drops events without a registration", () => {
    const groups = getRegistrationGroups([{ ...baseEvent, registration: null }]);

    expect(groups).toEqual({ upcoming: [], past: [], cancelled: [] });
  });

  it("sorts each group by start time", () => {
    const later: EventView = {
      ...baseEvent,
      id: "later",
      startAt: "2026-12-02T08:00:00+08:00",
      endAt: "2026-12-02T11:30:00+08:00",
    };

    const groups = getRegistrationGroups([later, baseEvent], "2026-10-22T00:00:00+08:00");

    expect(groups.upcoming).toEqual([baseEvent, later]);
  });
});
