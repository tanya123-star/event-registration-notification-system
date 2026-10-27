import { beforeEach, describe, expect, it, vi } from "vitest";

import { Role } from "@/generated/prisma/browser";
import { actionForbidden } from "@/lib/security/action-response";
import { ForbiddenError } from "@/lib/security/errors";

import { setUserActiveAction, updateUserRoleAction } from "./actions";

const guards = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const queries = vi.hoisted(() => ({
  countActiveAdmins: vi.fn(),
  getUserById: vi.fn(),
}));

const mutations = vi.hoisted(() => ({
  setUserActive: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock("@/lib/security/auth-guards", () => ({
  requirePermission: guards.requirePermission,
}));

vi.mock("@/lib/messaging/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("./mutations", () => ({
  deletePendingRoleAssignment: vi.fn(),
  setOfficerPosition: vi.fn(),
  setUserActive: mutations.setUserActive,
  updateUserRole: mutations.updateUserRole,
  upsertPendingRoleAssignment: vi.fn(),
}));

vi.mock("./queries", () => ({
  countActiveAdmins: queries.countActiveAdmins,
  getUserById: queries.getUserById,
  getUserManagementPage: vi.fn(),
}));

const actor = {
  id: "c111111111111111111111111",
  email: "admin@acdeducation.com",
  name: "Admin",
  role: Role.ADMIN,
  isActive: true,
  officerPosition: null,
};

const targetId = "c222222222222222222222222";

const target = (role: Role, isActive = true) => ({
  id: targetId,
  role,
  officerPosition: null,
  isActive,
});

beforeEach(() => {
  guards.requirePermission.mockReset();
  queries.countActiveAdmins.mockReset();
  queries.getUserById.mockReset();
  mutations.setUserActive.mockReset();
  mutations.updateUserRole.mockReset();
  guards.requirePermission.mockResolvedValue(actor);
  mutations.setUserActive.mockResolvedValue(undefined);
  mutations.updateUserRole.mockResolvedValue(undefined);
});

describe("updateUserRoleAction", () => {
  it("demotes an Officer to Student", async () => {
    queries.getUserById.mockResolvedValue(target(Role.OFFICER));

    await expect(updateUserRoleAction({ userId: targetId, role: Role.STUDENT })).resolves.toEqual({
      success: true,
    });

    expect(guards.requirePermission).toHaveBeenCalledWith("user.update");
    expect(mutations.updateUserRole).toHaveBeenCalledWith(targetId, Role.STUDENT);
    expect(queries.countActiveAdmins).not.toHaveBeenCalled();
  });

  it("rejects changing your own role", async () => {
    queries.getUserById.mockResolvedValue({ ...target(Role.ADMIN), id: actor.id });

    await expect(updateUserRoleAction({ userId: actor.id, role: Role.STUDENT })).resolves.toEqual({
      success: false,
      error: {
        code: "conflict",
        title: "Cannot change your own role",
        description: "Ask another administrator to change your role.",
      },
    });
    expect(mutations.updateUserRole).not.toHaveBeenCalled();
  });

  it("rejects demoting the last active Admin", async () => {
    queries.getUserById.mockResolvedValue(target(Role.ADMIN));
    queries.countActiveAdmins.mockResolvedValue(0);

    await expect(updateUserRoleAction({ userId: targetId, role: Role.STUDENT })).resolves.toEqual({
      success: false,
      error: {
        code: "conflict",
        title: "Last administrator",
        description:
          "Cannot remove the last active administrator. Assign another administrator first.",
      },
    });
    expect(queries.countActiveAdmins).toHaveBeenCalledWith(targetId);
    expect(mutations.updateUserRole).not.toHaveBeenCalled();
  });

  it("rejects editing the Developer account", async () => {
    queries.getUserById.mockResolvedValue(target(Role.DEV));

    await expect(updateUserRoleAction({ userId: targetId, role: Role.ADMIN })).resolves.toEqual({
      success: false,
      error: {
        code: "conflict",
        title: "Developer account",
        description: "Developer accounts cannot be assigned through this form.",
      },
    });
    expect(mutations.updateUserRole).not.toHaveBeenCalled();
  });

  it("returns the forbidden envelope when the caller lacks user.update", async () => {
    guards.requirePermission.mockRejectedValue(new ForbiddenError());

    await expect(updateUserRoleAction({ userId: targetId, role: Role.STUDENT })).resolves.toEqual(
      actionForbidden(),
    );
    expect(mutations.updateUserRole).not.toHaveBeenCalled();
  });
});

describe("setUserActiveAction", () => {
  it("rejects deactivating the last active Admin", async () => {
    queries.getUserById.mockResolvedValue(target(Role.ADMIN));
    queries.countActiveAdmins.mockResolvedValue(0);

    await expect(setUserActiveAction({ userId: targetId, isActive: false })).resolves.toEqual({
      success: false,
      error: {
        code: "conflict",
        title: "Last administrator",
        description:
          "Cannot deactivate the last active administrator. Assign another administrator first.",
      },
    });
    expect(queries.countActiveAdmins).toHaveBeenCalledWith(targetId);
    expect(mutations.setUserActive).not.toHaveBeenCalled();
  });

  it("deactivates an Officer", async () => {
    queries.getUserById.mockResolvedValue(target(Role.OFFICER));

    await expect(setUserActiveAction({ userId: targetId, isActive: false })).resolves.toEqual({
      success: true,
      data: { selfDeactivated: false },
    });
    expect(mutations.setUserActive).toHaveBeenCalledWith(targetId, false);
  });
});
