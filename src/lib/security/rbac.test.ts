import { describe, expect, it } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import {
  can,
  canWithPosition,
  PERMISSION_MATRIX,
  positionAllows,
  type AccessLevel,
  type Permission,
} from "@/lib/security/rbac";

type ExpectedRow = Record<Role, AccessLevel>;

const EXPECTED_MATRIX: Record<Permission, ExpectedRow> = {
  "user.read": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "user.create": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "user.update": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "user.delete": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "event.read_published": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "yes" },
  "event.read_all": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "event.create": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "event.edit": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "event.submit": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "event.approve": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "event.cancel": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "registration.create": { DEV: "yes", ADMIN: "no", OFFICER: "no", STUDENT: "yes" },
  "registration.cancel": { DEV: "yes", ADMIN: "no", OFFICER: "no", STUDENT: "yes" },
  "registration.read_own": { DEV: "yes", ADMIN: "no", OFFICER: "no", STUDENT: "yes" },
  "registration.read_event": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "attendance.scan": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "attendance.manual": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "attendance.view": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "task.create": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "task.read_own": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "task.read_assigned": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "task.read_all": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "task.update": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "task.update_status_own": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "task.delete": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "notification.read": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "yes" },
  "notification.create": { DEV: "yes", ADMIN: "yes", OFFICER: "yes", STUDENT: "no" },
  "officer.assign_president": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
};

const MATRIX_CASES = Object.entries(EXPECTED_MATRIX).flatMap(([permission, row]) =>
  Object.entries(row).map(([role, level]) => [permission, role, level] as const),
);

describe("PERMISSION_MATRIX", () => {
  it.each(MATRIX_CASES)("grants %s to %s as %s", (permission, role, level) => {
    expect(PERMISSION_MATRIX[permission as Permission][role as Role]).toBe(level);
  });

  it("covers every permission with every role", () => {
    for (const row of Object.values(PERMISSION_MATRIX)) {
      expect(Object.keys(row).sort()).toEqual(Object.values(Role).sort());
    }
  });

  it("has no club-scoped access level", () => {
    for (const row of Object.values(PERMISSION_MATRIX)) {
      for (const level of Object.values(row)) {
        expect(["yes", "no"]).toContain(level);
      }
    }
  });

  it("grants every permission to the developer recovery account", () => {
    for (const permission of Object.keys(PERMISSION_MATRIX) as Permission[]) {
      expect(PERMISSION_MATRIX[permission].DEV).toBe("yes");
    }
  });
});

describe("can", () => {
  it("denies a missing role", () => {
    expect(can(null, "task.read_own")).toBe(false);
  });

  it("allows a student to read published events", () => {
    expect(can(Role.STUDENT, "event.read_published")).toBe(true);
  });

  it("denies a student their own task list", () => {
    expect(can(Role.STUDENT, "task.read_own")).toBe(false);
  });

  it("denies a plain officer creating tasks", () => {
    expect(can(Role.OFFICER, "task.create")).toBe(false);
  });

  it("allows an admin to scan attendance", () => {
    expect(can(Role.ADMIN, "attendance.scan")).toBe(true);
  });
});

describe("positionAllows", () => {
  it.each([
    ["event.read_published", true],
    ["event.read_all", true],
    ["registration.read_event", true],
    ["attendance.scan", true],
    ["attendance.manual", true],
    ["attendance.view", true],
    ["task.read_own", true],
    ["task.update_status_own", true],
    ["notification.read", true],
    ["notification.create", true],
    ["event.create", false],
    ["event.edit", false],
    ["event.submit", false],
    ["event.cancel", false],
    ["task.create", false],
    ["task.read_assigned", false],
    ["task.update", false],
    ["task.delete", false],
  ] as const)("plain officer %s => %s", (permission, expected) => {
    expect(positionAllows(null, permission)).toBe(expected);
  });

  it.each([
    ["event.read_published", true],
    ["event.read_all", true],
    ["registration.read_event", true],
    ["attendance.scan", true],
    ["attendance.manual", true],
    ["attendance.view", true],
    ["task.read_own", true],
    ["task.update_status_own", true],
    ["notification.read", true],
    ["notification.create", true],
    ["event.create", true],
    ["event.edit", true],
    ["event.submit", true],
    ["event.cancel", true],
    ["task.create", true],
    ["task.read_assigned", true],
    ["task.update", true],
    ["task.delete", true],
    ["event.approve", false],
    ["task.read_all", false],
    ["user.read", false],
  ] as const)("president %s => %s", (permission, expected) => {
    expect(positionAllows(OfficerPosition.PRESIDENT, permission)).toBe(expected);
  });
});

describe("canWithPosition", () => {
  it("allows a plain officer to compose notifications", () => {
    expect(canWithPosition(Role.OFFICER, null, "notification.create")).toBe(true);
  });

  it("denies task creation to a plain officer", () => {
    expect(canWithPosition(Role.OFFICER, null, "task.create")).toBe(false);
  });

  it("allows task creation to a president", () => {
    expect(canWithPosition(Role.OFFICER, OfficerPosition.PRESIDENT, "task.create")).toBe(true);
  });

  it("ignores position for admins", () => {
    expect(canWithPosition(Role.ADMIN, null, "officer.assign_president")).toBe(true);
  });

  it("allows an admin to scan regardless of position", () => {
    expect(canWithPosition(Role.ADMIN, null, "attendance.scan")).toBe(true);
  });

  it("denies staff permissions to a student", () => {
    expect(canWithPosition(Role.STUDENT, null, "event.read_all")).toBe(false);
  });
});
