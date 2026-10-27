import { z } from "zod";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { isAllowedEmail, SCHOOL_EMAIL_REQUIRED_MESSAGE } from "@/lib/security/email-domain";
import { emailText, optionalText } from "@/lib/validation/form-utils";

export const AssignableRoleSchema = z.enum([Role.STUDENT, Role.OFFICER, Role.ADMIN]);

export const OfficerPositionSchema = z.enum([OfficerPosition.PRESIDENT]);

const officerPositionSchema = OfficerPositionSchema.nullable().default(null);

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid user identifier");

export const UserIdSchema = z.object({ userId: cuidSchema });

export const PendingRoleAssignmentIdSchema = z.object({ roleAssignmentId: cuidSchema });

export const SetUserActiveSchema = UserIdSchema.extend({ isActive: z.boolean() });

export const UpdateUserRoleSchema = z.object({
  userId: cuidSchema,
  role: AssignableRoleSchema,
});

export const AddPendingUserSchema = z
  .object({
    email: emailText("Email"),
    role: AssignableRoleSchema,
    officerPosition: officerPositionSchema,
    allowExternalEmail: z.boolean().default(false),
  })
  .superRefine(({ email, allowExternalEmail, role, officerPosition }, context) => {
    if (!isAllowedEmail(email, allowExternalEmail)) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: SCHOOL_EMAIL_REQUIRED_MESSAGE,
      });
    }
    if (officerPosition && role !== Role.OFFICER) {
      context.addIssue({
        code: "custom",
        path: ["officerPosition"],
        message: "Only officers can hold a position.",
      });
    }
  });

export const SetOfficerPositionSchema = z.object({
  userId: cuidSchema,
  officerPosition: officerPositionSchema,
});

export const UserRoleFilterSchema = z.enum([Role.STUDENT, Role.OFFICER, Role.ADMIN, Role.DEV]);

export const UserStatusFilterSchema = z.enum(["active", "inactive", "pending"]);

export const UserManagementPageQuerySchema = z.object({
  search: optionalText(100, "Search", true),
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  filters: z
    .object({
      role: z.array(UserRoleFilterSchema).optional(),
      status: z.array(UserStatusFilterSchema).optional(),
    })
    .optional(),
});

export type PendingRoleAssignmentIdPayload = z.input<typeof PendingRoleAssignmentIdSchema>;
export type SetUserActivePayload = z.input<typeof SetUserActiveSchema>;
export type UpdateUserRolePayload = z.input<typeof UpdateUserRoleSchema>;
export type AddPendingUserPayload = z.input<typeof AddPendingUserSchema>;
export type SetOfficerPositionPayload = z.input<typeof SetOfficerPositionSchema>;
