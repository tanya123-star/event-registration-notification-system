"use client";

import { useState } from "react";

import { SearchField } from "@/components/ui/SearchField/SearchField";
import { Select, SelectItem } from "@/components/ui/Select/Select";

import { filterEvents } from "../../filter";
import type { EventFilter, EventView } from "../../types";
import { EventCard } from "../EventCard/EventCard";
import styles from "./EventsBrowser.module.css";

interface EventsBrowserProps {
  events: EventView[];
  initialStatus?: EventFilter["status"];
}

export function EventsBrowser({ events, initialStatus = "all" }: EventsBrowserProps) {
  const [search, setSearch] = useState("");
  const [time, setTime] = useState<EventFilter["time"]>("upcoming");
  const [status, setStatus] = useState<EventFilter["status"]>(initialStatus);

  const filteredEvents = filterEvents(events, { search, time, status });

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <SearchField
          aria-label="Search events"
          placeholder="Search events by title or organizer"
          value={search}
          onChange={setSearch}
          className={styles.searchField}
        />
        <Select
          aria-label="Filter by date"
          value={time}
          onChange={(key) => {
            if (key === "upcoming" || key === "all") setTime(key);
          }}
          className={styles.select}
        >
          <SelectItem id="upcoming">Upcoming</SelectItem>
          <SelectItem id="all">All dates</SelectItem>
        </Select>
        <Select
          aria-label="Filter by registration status"
          value={status}
          onChange={(key) => {
            if (key === "open" || key === "all") setStatus(key);
          }}
          className={styles.select}
        >
          <SelectItem id="all">Any status</SelectItem>
          <SelectItem id="open">Open for registration</SelectItem>
        </Select>
        <p className={styles.resultCount} aria-live="polite">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {filteredEvents.length > 0 ? (
        <div className={styles.grid}>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>No events match your filters</p>
          <p className={styles.emptyText}>Try a different search or switch to all dates.</p>
        </div>
      )}
    </div>
  );
}
