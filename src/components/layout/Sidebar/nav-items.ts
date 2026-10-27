import type { IconType } from "react-icons";
import {
  FaBell,
  FaCalendarDays,
  FaClipboardCheck,
  FaHouse,
  FaListCheck,
  FaQrcode,
  FaScroll,
  FaStamp,
  FaTicket,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa6";

import { Role, type OfficerPosition } from "@/generated/prisma/browser";
import { canWithPosition, type Permission } from "@/lib/security/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  permission?: Permission;
  showUnreadBadge?: boolean;
}

export interface NavVisibilityInput {
  role: Role | null | undefined;
  officerPosition: OfficerPosition | null | undefined;
}

const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: FaHouse },
  { label: "Events", href: "/events", icon: FaCalendarDays },
  { label: "My Registrations", href: "/registrations", icon: FaTicket },
  { label: "My Attendance", href: "/attendance", icon: FaClipboardCheck },
  {
    label: "Notifications",
    href: "/notifications",
    icon: FaBell,
    permission: "notification.read",
    showUnreadBadge: true,
  },
];

const OFFICER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: FaHouse },
  { label: "Events", href: "/events", icon: FaCalendarDays },
  {
    label: "Attendance Scanner",
    href: "/attendance/scanner",
    icon: FaQrcode,
    permission: "attendance.scan",
  },
  {
    label: "Attendance Records",
    href: "/attendance/records",
    icon: FaUserCheck,
    permission: "attendance.view",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: FaBell,
    permission: "notification.read",
    showUnreadBadge: true,
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: FaHouse },
  {
    label: "Approvals",
    href: "/admin/approvals",
    icon: FaStamp,
    permission: "event.approve",
  },
  {
    label: "Events",
    href: "/admin/events",
    icon: FaCalendarDays,
    permission: "event.read_all",
  },
  { label: "People", href: "/admin/people", icon: FaUsers, permission: "user.read" },
  {
    label: "Tasks",
    href: "/admin/tasks",
    icon: FaListCheck,
    permission: "task.read_all",
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: FaUserCheck,
    permission: "attendance.view",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: FaBell,
    permission: "notification.read",
    showUnreadBadge: true,
  },
  // shortcut: Audit log uses user.read until audit.read lands with the Phase 8 page.
  { label: "Audit log", href: "/admin/audit-log", icon: FaScroll, permission: "user.read" },
];

export function getVisibleNavItems({ role, officerPosition }: NavVisibilityInput): NavItem[] {
  const items =
    role === Role.ADMIN || role === Role.DEV
      ? ADMIN_NAV_ITEMS
      : role === Role.OFFICER
        ? OFFICER_NAV_ITEMS
        : STUDENT_NAV_ITEMS;

  return items.filter(
    (item) => !item.permission || canWithPosition(role, officerPosition, item.permission),
  );
}
