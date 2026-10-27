import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";

import { applyPendingAssignment } from "./pending-user";

const mocks = vi.hoisted(() => {
  const tx = {
    user: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    pendingRoleAssignment: {
      delete: vi.fn(),
    },
  };
  return {
    tx,
    transaction: vi.fn(),
  };
});

vi.mock("@/lib/infra/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

beforeEach(() => {
  mocks.transaction.mockReset();
  mocks.transaction.mockImplementation(async (callback) => callback(mocks.tx));
  mocks.tx.user.updateMany.mockReset();
  mocks.tx.user.create.mockReset();
  mocks.tx.pendingRoleAssignment.delete.mockReset();
});

describe("applyPendingAssignment", () => {
  it("clears the previous President, creates the user, and deletes the invitation", async () => {
    await applyPendingAssignment("president@acdeducation.com", {
      name: "President",
      image: "https://example.com/avatar.png",
      role: Role.OFFICER,
      officerPosition: OfficerPosition.PRESIDENT,
      allowExternalEmail: false,
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { officerPosition: OfficerPosition.PRESIDENT },
      data: { officerPosition: null },
    });
    expect(mocks.tx.user.create).toHaveBeenCalledWith({
      data: {
        email: "president@acdeducation.com",
        name: "President",
        image: "https://example.com/avatar.png",
        role: Role.OFFICER,
        officerPosition: OfficerPosition.PRESIDENT,
        allowExternalEmail: false,
      },
    });
    expect(mocks.tx.pendingRoleAssignment.delete).toHaveBeenCalledWith({
      where: { email: "president@acdeducation.com" },
    });
  });

  it("does not clear another President for a non-president assignment", async () => {
    await applyPendingAssignment("officer@acdeducation.com", {
      name: "Officer",
      image: null,
      role: Role.OFFICER,
      officerPosition: null,
      allowExternalEmail: true,
    });

    expect(mocks.tx.user.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.user.create).toHaveBeenCalledWith({
      data: {
        email: "officer@acdeducation.com",
        name: "Officer",
        image: null,
        role: Role.OFFICER,
        officerPosition: null,
        allowExternalEmail: true,
      },
    });
    expect(mocks.tx.pendingRoleAssignment.delete).toHaveBeenCalledWith({
      where: { email: "officer@acdeducation.com" },
    });
  });
});
