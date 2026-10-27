"use client";

import clsx from "clsx";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FaBars, FaUser, FaX } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { useNavigationProgress } from "@/components/ui/TopProgressBar/navigation-context";
import { useUnreadCount } from "@/features/notifications/unread-count-context";
import { roleLabels } from "@/features/users/constants";
import { Role, type OfficerPosition } from "@/generated/prisma/browser";

import { toggleSidebarAction } from "./actions";
import { getVisibleNavItems } from "./nav-items";
import { useSidebar } from "./sidebar-context";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  initialCollapsed?: boolean;
  userName?: string | null;
  userRole?: Role | null;
  officerPosition?: OfficerPosition | null;
  userImage?: string | null;
}

export function Sidebar({
  initialCollapsed = false,
  userName,
  userRole,
  officerPosition,
  userImage,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [imgError, setImgError] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { startLoading } = useNavigationProgress();
  const { isOpen, close } = useSidebar();
  const { count: unreadCount } = useUnreadCount();
  const visibleNavItems = getVisibleNavItems({ role: userRole, officerPosition });

  const handleToggle = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    toggleSidebarAction(nextState);
  };

  const handleNavClick = (href: string) => {
    close();
    if (pathname !== href) {
      startLoading();
      router.push(href);
    }
  };

  return (
    <>
      <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)} data-open={isOpen}>
        <div className={styles.topRow}>
          <Image
            src="/school-logo.svg"
            alt="School logo"
            width={48}
            height={48}
            className={styles.logo}
          />
          <Button
            variant="ghost"
            className={styles.closeButton}
            aria-label="Close sidebar"
            onPress={close}
          >
            <FaX />
          </Button>
          <Button
            variant="ghost"
            className={styles.toggleButton}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onPress={handleToggle}
          >
            <FaBars />
          </Button>
        </div>
        <div className={styles.textContainer}>
          <h1 className={styles.title}>Event Registration &amp;</h1>
          <h1 className={styles.desc}>Notification System</h1>
        </div>
        <nav className={styles.navContainer}>
          {visibleNavItems.map((item) => {
            const showBadge = item.showUnreadBadge && unreadCount > 0;
            return (
              <Button
                key={item.href}
                variant="navigation"
                className={styles.navButton}
                onPress={() => handleNavClick(item.href)}
                data-active={pathname.startsWith(item.href)}
                title={collapsed ? item.label : undefined}
              >
                <span>
                  <item.icon />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
                {showBadge && (
                  <>
                    <span className={styles.navBadge} aria-hidden="true">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                    <span className={styles.srOnly}>{unreadCount} unread</span>
                  </>
                )}
              </Button>
            );
          })}
        </nav>
        <div className={styles.profileSection}>
          <div className={styles.profileAvatar}>
            {userImage && !imgError ? (
              <Image
                src={userImage}
                alt="Profile"
                width={40}
                height={40}
                className={styles.profileAvatarImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <FaUser className={styles.profileAvatarIcon} />
            )}
          </div>
          <div className={styles.profileNameRole}>
            {userName && <span className={styles.profileName}>{userName}</span>}
            {userRole && <span className={styles.profileRole}>{roleLabels[userRole]}</span>}
          </div>
        </div>
      </aside>
      <div className={styles.backdrop} data-open={isOpen} onClick={close} />
    </>
  );
}
