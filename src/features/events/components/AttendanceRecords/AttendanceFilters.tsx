"use client";

import { parseDate, type CalendarDate } from "@internationalized/date";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { DatePicker } from "@/components/ui/DatePicker/DatePicker";
import { SearchField } from "@/components/ui/SearchField/SearchField";
import { Select, SelectItem } from "@/components/ui/Select/Select";

import type { AttendanceEventOption } from "../../queries";
import styles from "./AttendanceFilters.module.css";

interface AttendanceFiltersProps {
  options: AttendanceEventOption[];
  initialEventId?: string;
  initialSearch?: string;
  initialMethod?: "QR" | "MANUAL";
  initialDate?: string;
}

export function AttendanceFilters({
  options,
  initialEventId,
  initialSearch,
  initialMethod,
  initialDate,
}: AttendanceFiltersProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState(initialEventId ?? "all");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [method, setMethod] = useState(initialMethod ?? "all");
  const [date, setDate] = useState<CalendarDate | null>(() => {
    if (!initialDate) return null;
    try {
      return parseDate(initialDate);
    } catch {
      return null;
    }
  });

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `/attendance/records?${query}` : "/attendance/records");
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (eventId !== "all") params.set("event", eventId);
    if (search.trim()) params.set("q", search.trim());
    if (method !== "all") params.set("method", method);
    if (date) params.set("date", date.toString());
    navigate(params);
  }

  function handleClear() {
    setEventId("all");
    setSearch("");
    setMethod("all");
    setDate(null);
    navigate(new URLSearchParams());
  }

  return (
    <form className={styles.filters} onSubmit={handleSubmit}>
      <SearchField
        label="Search"
        placeholder="Student name, student number, or reference"
        value={search}
        onChange={setSearch}
        className={styles.search}
      />
      <Select
        aria-label="Filter by event"
        value={eventId}
        onChange={(key) => {
          if (typeof key === "string") setEventId(key);
        }}
        className={styles.select}
      >
        <SelectItem id="all">All events</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} id={option.id}>
            {option.title}
          </SelectItem>
        ))}
      </Select>
      <Select
        aria-label="Filter by check-in method"
        value={method}
        onChange={(key) => {
          if (key === "all" || key === "QR" || key === "MANUAL") setMethod(key);
        }}
        className={styles.select}
      >
        <SelectItem id="all">Any method</SelectItem>
        <SelectItem id="QR">QR scan</SelectItem>
        <SelectItem id="MANUAL">Manual entry</SelectItem>
      </Select>
      <DatePicker<CalendarDate>
        label="Check-in date"
        value={date}
        onChange={(value) => setDate(value)}
        className={styles.date}
      />
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onPress={handleClear}>
          Clear
        </Button>
        <Button type="submit" variant="primary">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
