"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaBars, FaBell, FaUser } from "react-icons/fa6";

import { useSidebar } from "@/components/layout/Sidebar/sidebar-context";
import { Button } from "@/components/ui/Button/Button";
import { Link } from "@/components/ui/Link/Link";
import { SignOutButton } from "@/features/auth/components/SignOutButton/SignOutButton";
import { useUnreadCount } from "@/features/notifications/unread-count-context";
import { roleLabels } from "@/features/users/constants";
import type { Role } from "@/generated/prisma/browser";

import styles from "./Header.module.css";

interface HeaderProps {
  userImage: string | null;
  userName?: string | null;
  userRole?: Role | null;
}

export function Header({ userImage, userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const [imgError, setImgError] = useState(false);
  const { toggle } = useSidebar();
  const { count: unreadCount } = useUnreadCount();

  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/registrations")) {
      return path.endsWith("/ticket") ? "Event ticket" : "My Registrations";
    }
    if (path.startsWith("/attendance/scanner")) return "Attendance Scanner";
    if (path.startsWith("/attendance/records")) return "Attendance Records";
    if (path.startsWith("/attendance")) return "My Attendance";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path === "/events") return "Events";
    if (path.startsWith("/events/")) return "Event detail";
    if (path.startsWith("/admin/approvals")) return "Approvals";
    if (path.startsWith("/admin/events")) return "Events";
    if (path.startsWith("/admin/people")) return "People";
    if (path.startsWith("/admin/tasks")) return "Tasks";
    if (path.startsWith("/admin/attendance")) return "Attendance";
    if (path.startsWith("/admin/audit-log")) return "Audit log";
    return "";
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftGroup}>
        <Button
          variant="ghost"
          className={styles.hamburgerButton}
          aria-label="Open sidebar"
          onPress={toggle}
        >
          <FaBars />
        </Button>
        <h2 className={styles.pageTitle}>{getPageTitle(pathname || "")}</h2>
      </div>
      <div className={styles.rightSection}>
        <Link
          href="/notifications"
          variant="unstyled"
          className={styles.bellButton}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <FaBell aria-hidden="true" />
          {unreadCount > 0 && <span className={styles.bellDot} aria-hidden="true" />}
        </Link>
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            {userImage && !imgError ? (
              <Image
                src={userImage}
                alt="Profile"
                width={32}
                height={32}
                className={styles.avatar}
                onError={() => setImgError(true)}
              />
            ) : (
              <FaUser className={styles.userIcon} />
            )}
          </div>
          <div className={styles.nameRoleContainer}>
            {userName && <span className={styles.userName}>{userName}</span>}
            {userRole && <span className={styles.userRole}>{roleLabels[userRole]}</span>}
          </div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
