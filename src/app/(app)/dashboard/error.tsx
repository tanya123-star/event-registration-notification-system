"use client";

import { RouteError } from "@/components/ui/RouteError/RouteError";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function DashboardError({ error, unstable_retry }: DashboardErrorProps) {
  return (
    <RouteError
      error={error}
      retry={unstable_retry}
      title="Dashboard unavailable"
      message="We couldn't load your dashboard. Try again, or check notifications."
      backHref="/notifications"
      backLabel="Go to notifications"
    />
  );
}
