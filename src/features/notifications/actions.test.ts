import { beforeEach, describe, expect, it, vi } from "vitest";

import { Role } from "@/generated/prisma/browser";

import { markAllNotificationsReadAction } from "./actions";

const guards = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const mutations = vi.hoisted(() => ({
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("@/lib/security/auth-guards", () => ({
  requireAuth: vi.fn(),
  requirePermission: guards.requirePermission,
}));

vi.mock("./mutations", () => ({
  createNotification: vi.fn(),
  markAllNotificationsRead: mutations.markAllNotificationsRead,
  markNotificationRead: vi.fn(),
}));

vi.mock("./queries", () => ({
  getNotificationPage: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
}));

beforeEach(() => {
  guards.requirePermission.mockReset();
  mutations.markAllNotificationsRead.mockReset();
});

describe("markAllNotificationsReadAction", () => {
  it("marks every campus-wide notification for the signed-in user", async () => {
    guards.requirePermission.mockResolvedValue({
      id: "student-1",
      email: "student@example.com",
      name: "Student",
      role: Role.STUDENT,
      isActive: true,
      officerPosition: null,
    });
    mutations.markAllNotificationsRead.mockResolvedValue(undefined);

    await expect(markAllNotificationsReadAction()).resolves.toEqual({ success: true });

    expect(guards.requirePermission).toHaveBeenCalledWith("notification.read");
    expect(mutations.markAllNotificationsRead).toHaveBeenCalledWith({
      userId: "student-1",
    });
  });
});
