import { Link } from "@/components/ui/Link/Link";

import styles from "./AdminPlaceholder.module.css";

interface AdminPlaceholderProps {
  title: string;
  message: string;
}

export function AdminPlaceholder({ title, message }: AdminPlaceholderProps) {
  return (
    <section className={styles.page} aria-labelledby="admin-placeholder-title">
      <div className={styles.card}>
        <h2 id="admin-placeholder-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
    </section>
  );
}
