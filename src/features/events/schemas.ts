import { z } from "zod";

import { AttendanceMethod, EventStatus } from "@/generated/prisma/browser";
import { optionalText, requiredText } from "@/lib/validation/form-utils";

const eventIdSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid event identifier");

const nullableText = (max: number, label: string) =>
  optionalText(max, label).transform((value) => value ?? null);

const isoDateTime = (label: string) =>
  z.iso.datetime({ offset: true, error: `Enter a valid ${label.toLowerCase()}` });

const eventWriteFields = {
  title: requiredText(200, "Title"),
  description: nullableText(5000, "Description"),
  venue: requiredText(200, "Venue"),
  startAt: isoDateTime("Start date and time"),
  endAt: isoDateTime("End date and time").nullable().default(null),
  mechanics: nullableText(5000, "Mechanics"),
  programFlow: nullableText(5000, "Program flow"),
  requirements: nullableText(5000, "Requirements"),
  capacity: z
    .number({ error: "Enter a valid capacity" })
    .int("Capacity must be a whole number")
    .positive("Capacity must be greater than 0")
    .max(100000, "Capacity must not exceed 100000")
    .nullable()
    .default(null),
  registrationClosesAt: isoDateTime("Registration deadline").nullable().default(null),
};

const eventWriteSchema = z.object(eventWriteFields);
type EventWriteData = Pick<
  z.output<typeof eventWriteSchema>,
  "startAt" | "endAt" | "registrationClosesAt"
>;

function addEventWriteRules(values: EventWriteData, context: z.RefinementCtx): void {
  const { startAt, endAt, registrationClosesAt } = values;
  const start = new Date(startAt).getTime();

  if (endAt && new Date(endAt).getTime() <= start) {
    context.addIssue({
      code: "custom",
      path: ["endAt"],
      message: "End time must be after the start time",
    });
  }

  if (registrationClosesAt && new Date(registrationClosesAt).getTime() > start) {
    context.addIssue({
      code: "custom",
      path: ["registrationClosesAt"],
      message: "Registration must close on or before the event starts",
    });
  }
}

export const CreateEventSchema = eventWriteSchema.superRefine(addEventWriteRules);

export const UpdateEventSchema = eventWriteSchema
  .extend({ eventId: eventIdSchema })
  .superRefine(addEventWriteRules);

export const SubmitEventSchema = z.object({ eventId: eventIdSchema });

export const CancelEventSchema = z.object({ eventId: eventIdSchema });

export const UnpublishEventSchema = z.object({
  eventId: eventIdSchema,
  comment: requiredText(1000, "Comment"),
});

export const EventStatusFilterSchema = z.enum([
  EventStatus.DRAFT,
  EventStatus.SUBMITTED,
  EventStatus.REVISION_REQUESTED,
  EventStatus.APPROVED,
  EventStatus.PUBLISHED,
  EventStatus.CANCELLED,
]);

export const EventPageQuerySchema = z.object({
  search: optionalText(200, "Search", true),
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  filters: z
    .object({
      status: z.array(EventStatusFilterSchema).optional(),
    })
    .optional(),
});

export const RegisterForEventSchema = z.object({ eventId: eventIdSchema });

export const CancelRegistrationSchema = z.object({ eventId: eventIdSchema });

export const ApproveEventSchema = z.object({
  eventId: eventIdSchema,
  comment: optionalText(1000, "Comment"),
});

const attendanceMethodSchema = z.enum([AttendanceMethod.QR, AttendanceMethod.MANUAL]);

const attendanceReferenceSchema = requiredText(64, "Reference").transform((value) =>
  value.toUpperCase(),
);

export const VerifyAttendanceSchema = z.object({
  eventId: eventIdSchema,
  reference: attendanceReferenceSchema,
});

export const RecordAttendanceSchema = z.object({
  eventId: eventIdSchema,
  reference: attendanceReferenceSchema,
  method: attendanceMethodSchema,
});

export const AttendancePageQuerySchema = z.object({
  eventId: eventIdSchema.optional(),
  search: optionalText(200, "Search", true),
  method: attendanceMethodSchema.optional(),
  date: z.iso.date().optional(),
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});

export const RequestEventRevisionSchema = z.object({
  eventId: eventIdSchema,
  comment: requiredText(1000, "Comment"),
});

export type CreateEventPayload = z.input<typeof CreateEventSchema>;
export type UpdateEventPayload = z.input<typeof UpdateEventSchema>;
export type SubmitEventPayload = z.input<typeof SubmitEventSchema>;
export type CancelEventPayload = z.input<typeof CancelEventSchema>;
export type UnpublishEventPayload = z.input<typeof UnpublishEventSchema>;
export type EventPageQueryPayload = z.input<typeof EventPageQuerySchema>;
export type RegisterForEventPayload = z.input<typeof RegisterForEventSchema>;
export type CancelRegistrationPayload = z.input<typeof CancelRegistrationSchema>;
export type VerifyAttendancePayload = z.input<typeof VerifyAttendanceSchema>;
export type RecordAttendancePayload = z.input<typeof RecordAttendanceSchema>;
export type AttendancePageQueryPayload = z.input<typeof AttendancePageQuerySchema>;
export type ApproveEventPayload = z.input<typeof ApproveEventSchema>;
export type RequestEventRevisionPayload = z.input<typeof RequestEventRevisionSchema>;
