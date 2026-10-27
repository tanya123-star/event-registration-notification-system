import { MyRegistrations } from "@/features/events/components/MyRegistrations/MyRegistrations";
import { getStudentRegistrations } from "@/features/events/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function RegistrationsPage() {
  const actor = await requirePagePermission("registration.read_own");
  const events = await getStudentRegistrations(actor.id);

  return <MyRegistrations events={events} />;
}
