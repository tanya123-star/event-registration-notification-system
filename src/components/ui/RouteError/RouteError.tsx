"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Link } from "@/components/ui/Link/Link";

import styles from "./RouteError.module.css";

interface RouteErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function RouteError({
  error,
  retry,
  title = "Something went wrong",
  message = "We couldn't load this page. Try again, or return to the dashboard.",
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button variant="primary" onPress={retry}>
            Try again
          </Button>
          <Link href={backHref}>{backLabel}</Link>
        </div>
      </div>
    </section>
  );
}
