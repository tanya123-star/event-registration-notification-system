import { Role } from "@/generated/prisma/browser";

import type { AssignableRole } from "./constants";

export const peopleTabKeys = ["officers", "students", "admins", "pending"] as const;

export type PeopleTabKey = (typeof peopleTabKeys)[number];

export type PeopleStatusFilter = "active" | "inactive" | "pending";

export interface PeopleTabConfig {
  label: string;
  addLabel: string;
  defaultRole: AssignableRole;
  role: Role[] | null;
  status: PeopleStatusFilter[];
  showStatusFilter: boolean;
  searchPlaceholder: string;
  emptyContent: string;
}

export const DEFAULT_PEOPLE_TAB: PeopleTabKey = "officers";

const peopleTabConfigs: Record<PeopleTabKey, PeopleTabConfig> = {
  officers: {
    label: "Officers",
    addLabel: "Add officer",
    defaultRole: Role.OFFICER,
    role: [Role.OFFICER],
    status: ["active", "inactive"],
    showStatusFilter: true,
    searchPlaceholder: "Search officers...",
    emptyContent: "No officers yet",
  },
  students: {
    label: "Students",
    addLabel: "Add student",
    defaultRole: Role.STUDENT,
    role: [Role.STUDENT],
    status: ["active", "inactive"],
    showStatusFilter: true,
    searchPlaceholder: "Search students...",
    emptyContent: "No students yet",
  },
  admins: {
    label: "Admins",
    addLabel: "Invite admin",
    defaultRole: Role.ADMIN,
    role: [Role.ADMIN, Role.DEV],
    status: ["active", "inactive"],
    showStatusFilter: true,
    searchPlaceholder: "Search admins...",
    emptyContent: "No admins yet",
  },
  pending: {
    label: "Pending invitations",
    addLabel: "Invite",
    defaultRole: Role.STUDENT,
    role: null,
    status: ["pending"],
    showStatusFilter: false,
    searchPlaceholder: "Search invitations...",
    emptyContent: "No pending invitations",
  },
};

export function getPeopleTabConfig(tab: PeopleTabKey): PeopleTabConfig {
  return peopleTabConfigs[tab];
}

export function isPeopleTabKey(value: string): value is PeopleTabKey {
  return peopleTabKeys.some((tab) => tab === value);
}
