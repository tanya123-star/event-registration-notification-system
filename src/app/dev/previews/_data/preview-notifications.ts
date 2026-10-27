import { initialEvents } from "@/features/events/initial-events";
import type { NotificationRow } from "@/features/notifications/queries";
import { NotificationAudience } from "@/generated/prisma/browser";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const eventsById = new Map(initialEvents.map((event) => [event.id, event]));

function eventFields(eventId: string | null) {
  if (!eventId) {
    return { eventId: null, eventTitle: null, eventStartAt: null, eventVenue: null };
  }

  const event = eventsById.get(eventId);
  if (!event) {
    throw new Error(`Unknown preview event: ${eventId}`);
  }

  return {
    eventId,
    eventTitle: event.title,
    eventStartAt: new Date(event.startAt),
    eventVenue: event.venue,
  };
}

export function buildPreviewNotifications(): NotificationRow[] {
  const now = Date.now();

  return [
    {
      id: "ntf0000000000000000000001",
      title: "General Assembly this Friday",
      body: "Doors open at 12:30 PM in AVR 1. Attendance will be checked at the entrance.",
      audience: NotificationAudience.ALL,
      ...eventFields("evt0000000000000000000001"),
      createdAt: new Date(now - 2 * HOUR_MS),
      isRead: false,
    },
    {
      id: "ntf0000000000000000000002",
      title: "AI Session RSVP Now Open",
      body: "Reserve a seat for the alumni Q&A. Slots are first-come, first-served.",
      audience: NotificationAudience.ALL,
      ...eventFields("evt0000000000000000000002"),
      createdAt: new Date(now - 5 * HOUR_MS),
      isRead: false,
    },
    {
      id: "ntf0000000000000000000003",
      title: "Second Semester Enrollment is Open",
      body: "Complete your requirements before the end of the month and confirm your schedule with your adviser.",
      audience: NotificationAudience.ALL,
      ...eventFields(null),
      createdAt: new Date(now - DAY_MS),
      isRead: false,
    },
    {
      id: "ntf0000000000000000000004",
      title: "System Maintenance on Sunday",
      body: "The student portal will be offline from 12:00 AM to 4:00 AM. We apologize for the inconvenience.",
      audience: NotificationAudience.ALL,
      ...eventFields(null),
      createdAt: new Date(now - DAY_MS - 6 * HOUR_MS),
      isRead: true,
    },
    {
      id: "ntf0000000000000000000005",
      title: "Volunteers Needed this Weekend",
      body: "Sign up at the KASAMA office to reserve a slot and claim your certificate.",
      audience: NotificationAudience.ALL,
      ...eventFields("evt0000000000000000000003"),
      createdAt: new Date(now - 2 * DAY_MS),
      isRead: false,
    },
    {
      id: "ntf0000000000000000000006",
      title: "Web Development 101 Seats Available",
      body: "A few slots remain for the bootcamp. Bring your own laptop and install the required tools.",
      audience: NotificationAudience.ALL,
      ...eventFields("evt0000000000000000000004"),
      createdAt: new Date(now - 3 * DAY_MS),
      isRead: true,
    },
    {
      id: "ntf0000000000000000000007",
      title: "Donors Needed this Month",
      body: "Walk-ins are welcome. You must be at least 18, weigh 50 kg, and be in good health.",
      audience: NotificationAudience.ALL,
      ...eventFields("evt0000000000000000000005"),
      createdAt: new Date(now - 4 * DAY_MS),
      isRead: true,
    },
  ];
}
