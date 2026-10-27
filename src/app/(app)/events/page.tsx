import { EventsBrowser } from "@/features/events/components/EventsBrowser/EventsBrowser";
import { getPublishedEvents } from "@/features/events/queries";
import { Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";

interface EventsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { status } = await searchParams;
  const session = await auth();
  const studentId = session?.user?.role === Role.STUDENT ? session.user.id : undefined;
  const events = await getPublishedEvents({ studentId });

  return <EventsBrowser events={events} initialStatus={status === "open" ? "open" : "all"} />;
}
