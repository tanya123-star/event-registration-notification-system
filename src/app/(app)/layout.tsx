import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Header } from "@/components/layout/Header/Header";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { SidebarProvider } from "@/components/layout/Sidebar/sidebar-context";
import { ToastRegion } from "@/components/ui/Toast/Toast";
import { NavigationProvider } from "@/components/ui/TopProgressBar/navigation-context";
import { TopProgressBar } from "@/components/ui/TopProgressBar/TopProgressBar";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { buildNotificationScope } from "@/features/notifications/scope";
import { UnreadCountProvider } from "@/features/notifications/unread-count-context";
import { auth } from "@/lib/infra/auth";

import styles from "./layout.module.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user.isActive === false) {
    redirect("/deactivated?reason=deactivated");
  }

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  let initialUnreadCount = 0;
  if (session?.user?.id) {
    try {
      initialUnreadCount = await getUnreadNotificationCount(buildNotificationScope(session.user));
    } catch {
      initialUnreadCount = 0;
    }
  }

  return (
    <div className={styles.layout}>
      <NavigationProvider>
        <TopProgressBar />
        <UnreadCountProvider initialCount={initialUnreadCount}>
          <SidebarProvider>
            <Sidebar
              initialCollapsed={initialCollapsed}
              userName={session?.user?.name}
              userRole={session?.user?.role}
              officerPosition={session?.user?.officerPosition}
              userImage={session?.user?.image}
            />
            <div className={styles.main}>
              <Header
                userImage={session?.user?.image ?? null}
                userName={session?.user?.name}
                userRole={session?.user?.role}
              />
              <main className={styles.content}>{children}</main>
            </div>
          </SidebarProvider>
          <ToastRegion />
        </UnreadCountProvider>
      </NavigationProvider>
    </div>
  );
}
