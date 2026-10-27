import {
  countSubmittedEvents,
  getAttendanceEventOptions,
  getEventAttendanceStats,
  getPublishedEvents,
  getRecentAttendance,
  type AttendanceRecordRow,
  type AttendanceStats,
} from "@/features/events/queries";
import { getNotificationPage } from "@/features/notifications/queries";
import { buildNotificationScope } from "@/features/notifications/scope";
import {
  countActiveUsersByRole,
  countPendingRoleAssignments,
  getPresident,
} from "@/features/users/queries";
import { Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";
import { getDaypartGreeting } from "@/lib/primitives/date";
import { requirePagePermission } from "@/lib/security/auth-guards";

import { AdminDashboard } from "./_components/AdminDashboard/AdminDashboard";
import { OfficerDashboard } from "./_components/OfficerDashboard/OfficerDashboard";
import {
  StudentDashboard,
  type DashboardNotification,
} from "./_components/StudentDashboard/StudentDashboard";

interface DashboardPageProps {
  searchParams: Promise<{ event?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  const role = session?.user?.role;

  if (role === Role.OFFICER) {
    const { event: requestedEventId } = await searchParams;
    const options = await getAttendanceEventOptions();
    const selectedEvent =
      options.find((option) => option.id === requestedEventId) ?? options[0] ?? null;

    let stats: AttendanceStats | null = null;
    let recent: AttendanceRecordRow[] = [];
    if (selectedEvent) {
      [stats, recent] = await Promise.all([
        getEventAttendanceStats(selectedEvent.id),
        getRecentAttendance(selectedEvent.id, 5),
      ]);
    }

    return (
      <OfficerDashboard
        greeting={getDaypartGreeting()}
        userName={session?.user?.name ?? null}
        options={options}
        selectedEvent={selectedEvent}
        stats={stats}
        recent={recent}
      />
    );
  }

  if (role === Role.ADMIN || role === Role.DEV) {
    await requirePagePermission("user.read");

    const [students, activeOfficers, pendingInvitations, submittedEvents, president] =
      await Promise.all([
        countActiveUsersByRole(Role.STUDENT),
        countActiveUsersByRole(Role.OFFICER),
        countPendingRoleAssignments(),
        countSubmittedEvents(),
        getPresident(),
      ]);

    return (
      <AdminDashboard
        presidentName={president?.name ?? null}
        stats={{ students, activeOfficers, pendingInvitations, submittedEvents }}
      />
    );
  }

  let notifications: DashboardNotification[] = [];
  let events = [] as Awaited<ReturnType<typeof getPublishedEvents>>;
  if (session?.user) {
    const [page, publishedEvents] = await Promise.all([
      getNotificationPage({
        scope: buildNotificationScope(session.user),
        query: { pageSize: 3 },
      }),
      getPublishedEvents({ studentId: session.user.id }),
    ]);
    notifications = page.rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
    }));
    events = publishedEvents;
  }

  return (
    <StudentDashboard
      greeting={getDaypartGreeting()}
      userName={session?.user?.name ?? null}
      notifications={notifications}
      events={events}
    />
  );
}
