import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";

import {
  setOfficerPosition,
  setUserActive,
  updateUserRole,
  upsertPendingRoleAssignment,
} from "./mutations";
import { countActiveAdmins } from "./queries";

const mocks = vi.hoisted(() => {
  const user = {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  };
  return {
    user,
    transaction: vi.fn(),
    pendingUpsert: vi.fn(),
  };
});

vi.mock("@/lib/infra/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    user: mocks.user,
    pendingRoleAssignment: { upsert: mocks.pendingUpsert },
  },
}));

beforeEach(() => {
  mocks.transaction.mockReset();
  mocks.transaction.mockImplementation(async (callback) => callback({ user: mocks.user }));
  mocks.user.findUnique.mockReset();
  mocks.user.update.mockReset();
  mocks.user.updateMany.mockReset();
  mocks.user.count.mockReset();
  mocks.pendingUpsert.mockReset();
});

describe("setOfficerPosition", () => {
  it("clears the previous President and appoints the target in one transaction", async () => {
    mocks.user.findUnique.mockResolvedValue({ role: Role.OFFICER });

    await setOfficerPosition({
      userId: "user-2",
      officerPosition: OfficerPosition.PRESIDENT,
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-2" },
      select: { role: true },
    });
    expect(mocks.user.updateMany).toHaveBeenCalledWith({
      where: {
        officerPosition: OfficerPosition.PRESIDENT,
        id: { not: "user-2" },
      },
      data: { officerPosition: null },
    });
    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { officerPosition: OfficerPosition.PRESIDENT },
    });
    expect(JSON.stringify(mocks.user.findUnique.mock.calls)).not.toContain("clubId");
  });

  it("does not clear another user when clearing the position", async () => {
    mocks.user.findUnique.mockResolvedValue({ role: Role.OFFICER });

    await setOfficerPosition({ userId: "user-2", officerPosition: null });

    expect(mocks.user.updateMany).not.toHaveBeenCalled();
    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { officerPosition: null },
    });
  });

  it("rejects a position for a non-officer", async () => {
    mocks.user.findUnique.mockResolvedValue({ role: Role.STUDENT });

    await expect(
      setOfficerPosition({ userId: "user-2", officerPosition: OfficerPosition.PRESIDENT }),
    ).rejects.toThrow("Only officers can hold a position");
    expect(mocks.user.update).not.toHaveBeenCalled();
  });
});

describe("setUserActive", () => {
  it("clears the position when deactivating", async () => {
    await setUserActive("user-1", false);

    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isActive: false, officerPosition: null },
    });
  });

  it("keeps the position when reactivating", async () => {
    await setUserActive("user-1", true);

    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isActive: true },
    });
  });
});

describe("updateUserRole", () => {
  it.each([
    [Role.STUDENT, { role: Role.STUDENT, officerPosition: null }],
    [Role.ADMIN, { role: Role.ADMIN, officerPosition: null }],
    [Role.OFFICER, { role: Role.OFFICER }],
  ])("sets role %s without a stale position", async (role, data) => {
    await updateUserRole("user-1", role);

    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data,
    });
  });
});

describe("countActiveAdmins", () => {
  it("counts active admins only, excluding the target", async () => {
    mocks.user.count.mockResolvedValue(1);

    await expect(countActiveAdmins("user-1")).resolves.toBe(1);

    expect(mocks.user.count).toHaveBeenCalledWith({
      where: {
        isActive: true,
        role: Role.ADMIN,
        id: { not: "user-1" },
      },
    });
  });
});

describe("upsertPendingRoleAssignment", () => {
  it("writes a pending position without a club", async () => {
    await upsertPendingRoleAssignment({
      email: "officer@acdeducation.com",
      role: Role.OFFICER,
      officerPosition: OfficerPosition.PRESIDENT,
      allowExternalEmail: false,
      assignedById: "user-1",
    });

    const call = mocks.pendingUpsert.mock.calls[0]?.[0];
    expect(call).toEqual({
      where: { email: "officer@acdeducation.com" },
      update: {
        role: Role.OFFICER,
        officerPosition: OfficerPosition.PRESIDENT,
        allowExternalEmail: false,
        assignedById: "user-1",
        assignedAt: expect.any(Date),
      },
      create: {
        email: "officer@acdeducation.com",
        role: Role.OFFICER,
        officerPosition: OfficerPosition.PRESIDENT,
        allowExternalEmail: false,
        assignedById: "user-1",
      },
    });
    expect(call?.update).not.toHaveProperty("clubId");
    expect(call?.create).not.toHaveProperty("clubId");
  });
});
