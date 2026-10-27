import { NoticePage } from "@/components/ui/NoticePage/NoticePage";
import { AttendanceScanner } from "@/features/events/components/AttendanceScanner/AttendanceScanner";
import {
  getAttendanceEventOptions,
  getEventAttendanceStats,
  getRecentAttendance,
} from "@/features/events/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

interface AttendanceScannerPageProps {
  searchParams: Promise<{ event?: string }>;
}

export default async function AttendanceScannerPage({ searchParams }: AttendanceScannerPageProps) {
  await requirePagePermission("attendance.scan");
  const { event: requestedEventId } = await searchParams;
  const options = await getAttendanceEventOptions();
  const selectedEvent =
    options.find((option) => option.id === requestedEventId) ?? options[0] ?? null;

  if (!selectedEvent) {
    return (
      <NoticePage
        title="No events to scan"
        message="Attendance scanning opens once a published event has registered students."
      />
    );
  }

  const [stats, recent] = await Promise.all([
    getEventAttendanceStats(selectedEvent.id),
    getRecentAttendance(selectedEvent.id, 6),
  ]);

  return (
    <AttendanceScanner
      key={selectedEvent.id}
      options={options}
      selectedEvent={selectedEvent}
      stats={stats}
      recent={recent}
    />
  );
}
