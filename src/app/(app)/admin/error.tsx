"use client";

import { RouteError } from "@/components/ui/RouteError/RouteError";

interface AdminErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function AdminError({ error, unstable_retry }: AdminErrorProps) {
  return (
    <RouteError
      error={error}
      retry={unstable_retry}
      title="Admin page unavailable"
      message="We couldn't load this admin page. Try again, or return to the dashboard."
    />
  );
}
