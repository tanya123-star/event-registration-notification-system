import { z } from "zod";

import { TaskStatus, TaskType } from "@/generated/prisma/browser";

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid identifier");

export const TaskIdSchema = z.object({ taskId: cuidSchema });

export const CreateTaskSchema = z
  .object({
    eventId: cuidSchema.nullable().default(null),
    type: z.enum([TaskType.ATTENDANCE, TaskType.GENERAL]),
    assigneeId: cuidSchema,
    dueAt: z.coerce.date().nullable().default(null),
  })
  .superRefine(({ type, eventId, dueAt }, context) => {
    if (type === TaskType.ATTENDANCE && !eventId) {
      context.addIssue({
        code: "custom",
        path: ["eventId"],
        message: "Attendance tasks need an event.",
      });
    }
    if (type === TaskType.ATTENDANCE && !dueAt) {
      context.addIssue({
        code: "custom",
        path: ["dueAt"],
        message: "Attendance tasks need a due date.",
      });
    }
  });

export const UpdateTaskAssigneeSchema = z.object({
  taskId: cuidSchema,
  assigneeId: cuidSchema,
});

export const UpdateTaskStatusSchema = z.object({
  taskId: cuidSchema,
  status: z.enum([TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
});

export const TaskPageQuerySchema = z.object({
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});

export type TaskIdPayload = z.input<typeof TaskIdSchema>;
export type CreateTaskPayload = z.input<typeof CreateTaskSchema>;
export type UpdateTaskAssigneePayload = z.input<typeof UpdateTaskAssigneeSchema>;
export type UpdateTaskStatusPayload = z.input<typeof UpdateTaskStatusSchema>;
export type TaskPageQueryPayload = z.input<typeof TaskPageQuerySchema>;
