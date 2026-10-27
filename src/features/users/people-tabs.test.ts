import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/browser";

import {
  DEFAULT_PEOPLE_TAB,
  getPeopleTabConfig,
  peopleTabKeys,
  type PeopleTabConfig,
  type PeopleTabKey,
} from "./people-tabs";

const cases: Array<[PeopleTabKey, PeopleTabConfig]> = [
  [
    "officers",
    {
      label: "Officers",
      addLabel: "Add officer",
      defaultRole: Role.OFFICER,
      role: [Role.OFFICER],
      status: ["active", "inactive"],
      showStatusFilter: true,
      searchPlaceholder: "Search officers...",
      emptyContent: "No officers yet",
    },
  ],
  [
    "students",
    {
      label: "Students",
      addLabel: "Add student",
      defaultRole: Role.STUDENT,
      role: [Role.STUDENT],
      status: ["active", "inactive"],
      showStatusFilter: true,
      searchPlaceholder: "Search students...",
      emptyContent: "No students yet",
    },
  ],
  [
    "admins",
    {
      label: "Admins",
      addLabel: "Invite admin",
      defaultRole: Role.ADMIN,
      role: [Role.ADMIN, Role.DEV],
      status: ["active", "inactive"],
      showStatusFilter: true,
      searchPlaceholder: "Search admins...",
      emptyContent: "No admins yet",
    },
  ],
  [
    "admins",
    {
      label: "Admins",
      addLabel: "Invite admin",
      defaultRole: Role.ADMIN,
      role: [Role.ADMIN, Role.DEV],
      status: ["active", "inactive"],
      showStatusFilter: true,
      searchPlaceholder: "Search admins...",
      emptyContent: "No admins yet",
    },
  ],
  [
    "pending",
    {
      label: "Pending invitations",
      addLabel: "Invite",
      defaultRole: Role.STUDENT,
      role: null,
      status: ["pending"],
      showStatusFilter: false,
      searchPlaceholder: "Search invitations...",
      emptyContent: "No pending invitations",
    },
  ],
];

describe("getPeopleTabConfig", () => {
  it.each(cases)("returns the %s tab configuration", (key, expected) => {
    expect(getPeopleTabConfig(key)).toEqual(expected);
  });

  it("orders the tabs with Officers first and Pending invitations last", () => {
    expect(peopleTabKeys).toEqual(["officers", "students", "admins", "pending"]);
  });

  it("opens on the Officers tab", () => {
    expect(DEFAULT_PEOPLE_TAB).toBe("officers");
  });
});
