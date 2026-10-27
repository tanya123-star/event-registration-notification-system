import { describe, expect, it } from "vitest";

import { filterEvents } from "./filter";
import type { EventFilter, EventView } from "./types";

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
  registration: null,
  status: "open",
  remainingSeats: 120,
  canCancel: false,
};

const now = new Date("2026-10-22T00:00:00+08:00");

function filter(overrides: Partial<EventFilter> = {}): EventFilter {
  return { search: "", time: "all", status: "all", ...overrides };
}

describe("filterEvents", () => {
  it("matches the search against title and organizer", () => {
    expect(filterEvents([baseEvent], filter({ search: "science" }), now)).toEqual([baseEvent]);
    expect(filterEvents([baseEvent], filter({ search: "kasama" }), now)).toEqual([baseEvent]);
    expect(filterEvents([baseEvent], filter({ search: "robotics" }), now)).toEqual([]);
  });

  it("keeps only events that have not started when filtering upcoming", () => {
    const started = { ...baseEvent, id: "started", startAt: "2026-10-20T08:00:00+08:00" };

    expect(filterEvents([baseEvent, started], filter({ time: "upcoming" }), now)).toEqual([
      baseEvent,
    ]);
  });

  it("keeps only open events when filtering by registration status", () => {
    const registered = { ...baseEvent, id: "registered", status: "registered" as const };

    expect(filterEvents([baseEvent, registered], filter({ status: "open" }), now)).toEqual([
      baseEvent,
    ]);
  });

  it("sorts matches by start time", () => {
    const later = {
      ...baseEvent,
      id: "later",
      startAt: "2026-12-02T08:00:00+08:00",
      endAt: "2026-12-02T11:30:00+08:00",
    };

    expect(filterEvents([later, baseEvent], filter(), now)).toEqual([baseEvent, later]);
  });
});
