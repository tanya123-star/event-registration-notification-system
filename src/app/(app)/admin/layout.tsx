import { requirePagePermission } from "@/lib/security/auth-guards";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requirePagePermission("user.read");

  return children;
}
