import { z } from "zod";

import { requiredText } from "@/lib/validation/form-utils";

export const SendNotificationSchema = z.object({
  title: requiredText(160, "Title"),
  body: requiredText(5000, "Body"),
});

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().regex(/^c[a-z0-9]{24}$/, "Invalid notification identifier"),
});

export const NotificationStatusFilterSchema = z.enum(["unread", "read"]);

export const NotificationPageQuerySchema = z.object({
  search: z.string().max(200).optional(),
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  sort: z
    .object({
      column: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
  filters: z
    .object({
      status: z.array(NotificationStatusFilterSchema).max(2).optional(),
    })
    .optional(),
});

export type SendNotificationPayload = z.input<typeof SendNotificationSchema>;
export type MarkNotificationReadPayload = z.input<typeof MarkNotificationReadSchema>;
