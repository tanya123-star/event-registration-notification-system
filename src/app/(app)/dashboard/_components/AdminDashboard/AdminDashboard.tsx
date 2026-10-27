import clsx from "clsx";
import type { IconType } from "react-icons";
import {
  FaCalendarDays,
  FaChevronRight,
  FaClipboardCheck,
  FaTicket,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa6";

import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { Link } from "@/components/ui/Link/Link";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";

import styles from "./AdminDashboard.module.css";

interface AdminDashboardStats {
  students: number;
  activeOfficers: number;
  pendingInvitations: number;
  submittedEvents: number;
}

interface AdminDashboardProps {
  presidentName: string | null;
  stats: AdminDashboardStats;
}

interface ActionItem {
  label: string;
  href: string;
  hint: string;
  value: number | null;
}

interface StatItem {
  label: string;
  value: number | null;
  hint: string;
  icon: IconType;
  tone: "sky" | "success" | "warning";
}

export function AdminDashboard({ presidentName, stats }: AdminDashboardProps) {
  const actionItems: ActionItem[] = [
    {
      label: "Events awaiting approval",
      href: "/admin/approvals",
      hint: "Review and publish",
      value: stats.submittedEvents,
    },
    {
      label: "Upcoming events without an attendance task",
      href: "/admin/attendance",
      hint: "Arrives in Phase 6",
      value: null,
    },
    {
      label: "Overdue or unstarted attendance tasks",
      href: "/admin/tasks",
      hint: "Arrives in Phase 5",
      value: null,
    },
    {
      label: "Pending invitations not yet signed in",
      href: "/admin/people",
      hint: "Manage in People",
      value: stats.pendingInvitations,
    },
  ];

  const statItems: StatItem[] = [
    {
      label: "Students",
      value: stats.students,
      hint: "Active student accounts",
      icon: FaUsers,
      tone: "sky",
    },
    {
      label: "Active officers",
      value: stats.activeOfficers,
      hint: "Including the President",
      icon: FaUserCheck,
      tone: "success",
    },
    {
      label: "Published events",
      value: null,
      hint: "Not connected yet",
      icon: FaCalendarDays,
      tone: "warning",
    },
    {
      label: "Registrations this week",
      value: null,
      hint: "Not connected yet",
      icon: FaTicket,
      tone: "warning",
    },
    {
      label: "Average attendance rate",
      value: null,
      hint: "Not connected yet",
      icon: FaClipboardCheck,
      tone: "warning",
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.actionPanel} aria-labelledby="admin-actions-title">
        <header className={styles.panelHeader}>
          <div>
            <h2 id="admin-actions-title" className={styles.panelTitle}>
              Needs your action
            </h2>
            <p className={styles.panelSubtitle}>
              Approve events, keep attendance moving, and finish onboarding.
            </p>
          </div>
        </header>
        <div className={styles.actionList}>
          {actionItems.map((item) => (
            <Link key={item.href} href={item.href} variant="unstyled" className={styles.actionRow}>
              <span className={styles.actionCopy}>
                <span className={styles.actionLabel}>{item.label}</span>
                <span className={styles.actionHint}>{item.hint}</span>
              </span>
              <span className={styles.actionMeta}>
                {item.value === null ? (
                  <StatusBadge variant="cancelled">Not connected</StatusBadge>
                ) : (
                  <span className={styles.actionCount}>{item.value}</span>
                )}
                <FaChevronRight aria-hidden="true" className={styles.actionChevron} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.statsSection} aria-labelledby="admin-stats-title">
        <header className={styles.panelHeader}>
          <div>
            <h2 id="admin-stats-title" className={styles.panelTitle}>
              System at a glance
            </h2>
            <p className={styles.panelSubtitle}>
              People counts are live. Event, registration, and attendance metrics are placeholders.
            </p>
          </div>
        </header>
        <ul className={styles.stats}>
          {statItems.map((stat) => (
            <li key={stat.label} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={clsx(styles.statIcon, styles[stat.tone])}>
                  <stat.icon aria-hidden="true" />
                </span>
              </div>
              <p className={styles.statValue}>{stat.value ?? "—"}</p>
              <p className={styles.statHint}>{stat.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="admin-upcoming-title">
        <header className={styles.panelHeader}>
          <div>
            <h2 id="admin-upcoming-title" className={styles.panelTitle}>
              Upcoming events
            </h2>
            <p className={styles.panelSubtitle}>Published events and capacity</p>
          </div>
        </header>
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>
            Upcoming events, registered vs capacity, and assigned scanners will appear once the
            event workflow is connected.
          </p>
          <StatusBadge variant="cancelled">Phase 4</StatusBadge>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="admin-tasks-title">
        <header className={styles.panelHeader}>
          <div>
            <h2 id="admin-tasks-title" className={styles.panelTitle}>
              Task overview
            </h2>
            <p className={styles.panelSubtitle}>Counts by status and top officers</p>
          </div>
        </header>
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>
            Counts by status, including Overdue, and the officers with the most open tasks will
            appear once tasks are connected.
          </p>
          <StatusBadge variant="cancelled">Phase 5</StatusBadge>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="admin-team-title">
        <header className={styles.panelHeader}>
          <div>
            <h2 id="admin-team-title" className={styles.panelTitle}>
              Team
            </h2>
            <p className={styles.panelSubtitle}>Leadership and active officers</p>
          </div>
        </header>
        <div className={styles.teamRow}>
          <div className={styles.teamCopy}>
            <span className={styles.teamLabel}>President</span>
            <span className={styles.teamValue}>{presidentName ?? "No President assigned"}</span>
          </div>
          <ButtonLink href="/admin/people" variant="secondary" className={styles.teamAction}>
            Change
          </ButtonLink>
        </div>
        <div className={styles.teamRow}>
          <div className={styles.teamCopy}>
            <span className={styles.teamLabel}>Active officers</span>
            <span className={styles.teamValue}>{stats.activeOfficers}</span>
          </div>
          <Link href="/admin/people" className={styles.teamLink}>
            View people
          </Link>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="admin-activity-title">
        <header className={styles.panelHeader}>
          <div>
            <h2 id="admin-activity-title" className={styles.panelTitle}>
              Recent activity
            </h2>
            <p className={styles.panelSubtitle}>Approvals, role changes, and scans</p>
          </div>
        </header>
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>
            Approvals, role changes, and Admin scans will appear here once the audit log is
            connected.
          </p>
          <StatusBadge variant="cancelled">Phase 8</StatusBadge>
        </div>
      </section>
    </div>
  );
}
