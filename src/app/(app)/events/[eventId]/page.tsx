import { notFound } from "next/navigation";

import { EventDetailView } from "@/features/events/components/EventDetailView/EventDetailView";
import { getPublishedEventById } from "@/features/events/queries";
import { Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const session = await auth();
  const isStudent = session?.user?.role === Role.STUDENT;
  const event = await getPublishedEventById(eventId, {
    studentId: isStudent ? session.user.id : undefined,
  });

  if (!event) notFound();

  return <EventDetailView event={event} canRegister={isStudent} />;
}
