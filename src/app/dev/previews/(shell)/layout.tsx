import { PreviewHeader } from "@/app/dev/previews/_components/PreviewHeader/PreviewHeader";
import { Role } from "@/generated/prisma/browser";

import styles from "./layout.module.css";

interface PreviewShellLayoutProps {
  children: React.ReactNode;
}

export default function PreviewShellLayout({ children }: PreviewShellLayoutProps) {
  // Toast region omitted: unauthenticated preview fetches would queue a load-error toast.
  return (
    <div className={styles.shell}>
      <PreviewHeader userName="Maria Santos" userRole={Role.ADMIN} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
