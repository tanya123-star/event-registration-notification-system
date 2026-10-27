import type { EventFilter, EventView } from "./types";

/**
 * Applies the Events page search, date, and registration-status filters to a
 * server-fetched event list. Filtering stays client-side because the published
 * event list is already small and fully loaded.
 */
export function filterEvents(
  eventsToFilter: EventView[],
  filter: EventFilter,
  now: Date = new Date(),
): EventView[] {
  const search = filter.search.trim().toLowerCase();
  const nowTime = now.getTime();

  return eventsToFilter
    .filter((event) => {
      const matchesSearch =
        search.length === 0 ||
        event.title.toLowerCase().includes(search) ||
        event.organizer.toLowerCase().includes(search);
      const matchesTime = filter.time === "all" || new Date(event.startAt).getTime() >= nowTime;
      const matchesStatus = filter.status === "all" || event.status === "open";
      return matchesSearch && matchesTime && matchesStatus;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
