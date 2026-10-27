import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { requireAuth, requirePagePermission, requirePermission } from "@/lib/security/auth-guards";
import { DeactivatedError, ForbiddenError, UnauthorizedError } from "@/lib/security/errors";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/infra/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

interface SessionOverrides {
  role?: Role;
  officerPosition?: OfficerPosition | null;
  isActive?: boolean;
}

function signIn(overrides: SessionOverrides = {}) {
  mocks.auth.mockResolvedValue({
    user: {
      id: "user-1",
      email: "officer@example.com",
      name: "Officer",
      role: Role.OFFICER,
      isActive: true,
      officerPosition: null,
      ...overrides,
    },
  });
}

beforeEach(() => {
  mocks.auth.mockReset();
  vi.mocked(redirect).mockReset();
});

describe("requireAuth", () => {
  it("returns the authenticated user without a club field", async () => {
    signIn({ officerPosition: OfficerPosition.PRESIDENT });

    const user = await requireAuth();

    expect(user).toEqual({
      id: "user-1",
      email: "officer@example.com",
      name: "Officer",
      role: Role.OFFICER,
      isActive: true,
      officerPosition: OfficerPosition.PRESIDENT,
    });
    expect(user).not.toHaveProperty("clubId");
  });

  it("rejects a missing session", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a deactivated account", async () => {
    signIn({ isActive: false });

    await expect(requireAuth()).rejects.toBeInstanceOf(DeactivatedError);
  });
});

describe("requirePermission", () => {
  it("allows a President to create tasks", async () => {
    signIn({ officerPosition: OfficerPosition.PRESIDENT });

    await expect(requirePermission("task.create")).resolves.toMatchObject({
      id: "user-1",
      officerPosition: OfficerPosition.PRESIDENT,
    });
  });

  it("denies task creation to a plain officer", async () => {
    signIn();

    await expect(requirePermission("task.create")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows a plain officer to compose notifications", async () => {
    signIn();

    await expect(requirePermission("notification.create")).resolves.toMatchObject({
      id: "user-1",
    });
  });

  it("denies a replaced President when the refreshed position is empty", async () => {
    signIn({ officerPosition: null });

    await expect(requirePermission("task.create")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows an Admin to assign a President", async () => {
    signIn({ role: Role.ADMIN, officerPosition: null });

    await expect(requirePermission("officer.assign_president")).resolves.toMatchObject({
      role: Role.ADMIN,
    });
  });

  it("denies a Student reading their own tasks", async () => {
    signIn({ role: Role.STUDENT });

    await expect(requirePermission("task.read_own")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("requirePagePermission", () => {
  it("returns the user when the permission is granted", async () => {
    signIn({ role: Role.ADMIN });

    await expect(requirePagePermission("user.read")).resolves.toEqual({
      id: "user-1",
      email: "officer@example.com",
      name: "Officer",
      role: Role.ADMIN,
      isActive: true,
      officerPosition: null,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([
    ["Officer", Role.OFFICER],
    ["Student", Role.STUDENT],
  ])("redirects a %s to access denied", async (_label, role) => {
    signIn({ role });

    await expect(requirePagePermission("user.read")).rejects.toBeInstanceOf(ForbiddenError);
    expect(redirect).toHaveBeenCalledWith("/access-denied");
  });

  it("redirects a deactivated account", async () => {
    signIn({ isActive: false });

    await expect(requirePagePermission("user.read")).rejects.toBeInstanceOf(DeactivatedError);
    expect(redirect).toHaveBeenCalledWith("/deactivated?reason=deactivated");
  });

  it("redirects a missing session to sign-in", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(requirePagePermission("user.read")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});
