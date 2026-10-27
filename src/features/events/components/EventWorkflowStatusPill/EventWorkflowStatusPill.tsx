import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge/StatusBadge";
import { EventStatus } from "@/generated/prisma/browser";

interface EventWorkflowStatusPillProps {
  status: EventStatus;
  className?: string;
}

const statusConfig: Record<EventStatus, { label: string; variant: StatusBadgeVariant }> = {
  [EventStatus.DRAFT]: { label: "Draft", variant: "cancelled" },
  [EventStatus.SUBMITTED]: { label: "Submitted", variant: "info" },
  [EventStatus.REVISION_REQUESTED]: { label: "Revision requested", variant: "warning" },
  [EventStatus.APPROVED]: { label: "Approved", variant: "done" },
  [EventStatus.PUBLISHED]: { label: "Published", variant: "done" },
  [EventStatus.CANCELLED]: { label: "Cancelled", variant: "cancelled" },
};

export function EventWorkflowStatusPill({ status, className }: EventWorkflowStatusPillProps) {
  const { label, variant } = statusConfig[status];
  return (
    <StatusBadge variant={variant} className={className}>
      {label}
    </StatusBadge>
  );
}
