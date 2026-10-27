import { formatTodayLong, getAppTimeZone } from "@/lib/primitives/date";

export function formatEventDay(date: string): string {
  return formatTodayLong(new Date(date));
}

export function formatEventWeekdayShort(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: getAppTimeZone(),
    weekday: "short",
  }).format(new Date(date));
}

export function formatEventTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: getAppTimeZone(),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatEventTimeRange(startAt: string, endAt: string): string {
  return `${formatEventTime(startAt)} – ${formatEventTime(endAt)}`;
}

export function formatEventMonthYear(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: getAppTimeZone(),
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatEventDateMedium(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: getAppTimeZone(),
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatLongDateTime(date: string): string {
  const value = new Date(date);
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: getAppTimeZone(),
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: getAppTimeZone(),
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
  return `${datePart} at ${timePart}`;
}
