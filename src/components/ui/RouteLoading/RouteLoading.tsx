import { ProgressCircle } from "@/components/ui/ProgressCircle/ProgressCircle";

import styles from "./RouteLoading.module.css";

interface RouteLoadingProps {
  label?: string;
}

export function RouteLoading({ label = "Loading" }: RouteLoadingProps) {
  return (
    <div className={styles.page} role="status" aria-live="polite">
      <ProgressCircle aria-label={label} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
