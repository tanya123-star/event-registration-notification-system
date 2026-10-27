import { describe, expect, it } from "vitest";

import { AddPendingUserSchema } from "./schemas";

const basePayload = {
  role: "STUDENT",
} as const;

describe("AddPendingUserSchema", () => {
  it.each([
    {
      email: "student@acdeducation.com",
      allowExternalEmail: false,
      expected: true,
    },
    {
      email: "student@acdeducation.com",
      allowExternalEmail: true,
      expected: true,
    },
    {
      email: "guest@example.com",
      allowExternalEmail: true,
      expected: true,
    },
    {
      email: "guest@example.com",
      allowExternalEmail: false,
      expected: false,
    },
  ])(
    "returns $expected for $email with bypass set to $allowExternalEmail",
    ({ email, allowExternalEmail, expected }) => {
      const result = AddPendingUserSchema.safeParse({
        ...basePayload,
        email,
        allowExternalEmail,
      });
      expect(result.success).toBe(expected);
    },
  );

  it("reports an unapproved external email on the email field", () => {
    const result = AddPendingUserSchema.safeParse({
      ...basePayload,
      email: "guest@example.com",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["email"]);
  });

  it("accepts an officer without a club", () => {
    const result = AddPendingUserSchema.safeParse({
      ...basePayload,
      email: "officer@acdeducation.com",
      role: "OFFICER",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a position on a non-officer", () => {
    const result = AddPendingUserSchema.safeParse({
      ...basePayload,
      email: "student@acdeducation.com",
      officerPosition: "PRESIDENT",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.path)).toContainEqual(["officerPosition"]);
  });

  it("accepts an officer with a position", () => {
    const result = AddPendingUserSchema.safeParse({
      ...basePayload,
      email: "officer@acdeducation.com",
      role: "OFFICER",
      officerPosition: "PRESIDENT",
    });

    expect(result.success).toBe(true);
  });
});
