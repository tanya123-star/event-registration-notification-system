import { isEventStarted } from "./status";
import type { EventView } from "./types";

export type RegistrationTab = "upcoming" | "past" | "cancelled";

export interface RegistrationGroups {
  upcoming: EventView[];
  past: EventView[];
  cancelled: EventView[];
}

function byStartAt(a: EventView, b: EventView): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

export function getRegistrationGroups(
  events: EventView[],
  now: string | Date = new Date(),
): RegistrationGroups {
  const groups: RegistrationGroups = { upcoming: [], past: [], cancelled: [] };

  for (const event of events) {
    if (event.registration?.state === "cancelled") {
      groups.cancelled.push(event);
    } else if (event.registration?.state === "registered") {
      (isEventStarted(event, now) ? groups.past : groups.upcoming).push(event);
    }
  }

  groups.upcoming.sort(byStartAt);
  groups.past.sort(byStartAt);
  groups.cancelled.sort(byStartAt);
  return groups;
}
