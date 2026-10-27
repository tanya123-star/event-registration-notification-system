import { AttendanceRecords } from "@/features/events/components/AttendanceRecords/AttendanceRecords";
import {
  getAttendanceEventOptions,
  getAttendancePage,
  type AttendancePageQuery,
} from "@/features/events/queries";
import { AttendancePageQuerySchema } from "@/features/events/schemas";
import { requirePagePermission } from "@/lib/security/auth-guards";

interface AttendanceRecordsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AttendanceRecordsPage({ searchParams }: AttendanceRecordsPageProps) {
  await requirePagePermission("attendance.view");
  const params = await searchParams;
  const parsed = AttendancePageQuerySchema.safeParse({
    eventId: firstValue(params.event),
    search: firstValue(params.q),
    method: firstValue(params.method),
    date: firstValue(params.date),
    cursor: firstValue(params.cursor),
  });
  const query: AttendancePageQuery = parsed.success ? parsed.data : {};

  const options = await getAttendanceEventOptions();
  const eventId =
    query.eventId && options.some((option) => option.id === query.eventId)
      ? query.eventId
      : undefined;
  const page = await getAttendancePage({ ...query, eventId });

  const nextParams = new URLSearchParams();
  if (eventId) nextParams.set("event", eventId);
  if (query.search) nextParams.set("q", query.search);
  if (query.method) nextParams.set("method", query.method);
  if (query.date) nextParams.set("date", query.date);
  if (page.nextCursor) nextParams.set("cursor", page.nextCursor);

  return (
    <AttendanceRecords
      options={options}
      rows={page.rows}
      nextHref={page.nextCursor ? `/attendance/records?${nextParams.toString()}` : null}
      filters={{ eventId, search: query.search, method: query.method, date: query.date }}
    />
  );
}
