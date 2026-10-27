import { notFound } from "next/navigation";

import { EventTicket } from "@/features/events/components/EventTicket/EventTicket";
import { getRegistrationTicket } from "@/features/events/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

interface TicketPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { eventId } = await params;
  const actor = await requirePagePermission("registration.read_own");
  const ticket = await getRegistrationTicket(eventId, actor.id);

  if (!ticket) notFound();

  return (
    <EventTicket
      event={ticket.event}
      reference={ticket.registration.reference}
      attendeeName={actor.name}
      attendeeEmail={actor.email}
    />
  );
}
