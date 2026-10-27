import { ApprovalsQueue } from "@/features/events/components/ApprovalsQueue/ApprovalsQueue";
import { getApprovalQueue } from "@/features/events/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function AdminApprovalsPage() {
  await requirePagePermission("event.approve");
  const rows = await getApprovalQueue();

  return <ApprovalsQueue initialRows={rows} />;
}
