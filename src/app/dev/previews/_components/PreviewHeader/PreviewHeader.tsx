"use client";

import { usePathname } from "next/navigation";
import { FaUser } from "react-icons/fa6";

import { roleLabels } from "@/features/users/constants";
import type { Role } from "@/generated/prisma/browser";

import styles from "./PreviewHeader.module.css";

const appName = "Event Registration Notification System";

const pageTitles: Record<string, string> = {
  "/dev/previews/users": "People",
  "/dev/previews/notifications": "Notifications",
};

interface PreviewHeaderProps {
  userName: string;
  userRole: Role;
}

export function PreviewHeader({ userName, userRole }: PreviewHeaderProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Preview";

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.appName}>{appName}</span>
        <span className={styles.divider} aria-hidden="true" />
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
      </div>

      <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true">
          <FaUser className={styles.userIcon} />
        </span>
        <span className={styles.userName}>{userName}</span>
        <span className={styles.roleBadge}>{roleLabels[userRole]}</span>
      </div>
    </header>
  );
}
