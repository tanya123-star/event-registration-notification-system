import { UsersManagement } from "@/features/users/components/UsersManagement/UsersManagement";
import { DEFAULT_PEOPLE_TAB, getPeopleTabConfig } from "@/features/users/people-tabs";
import { getPresident, getUserManagementPage } from "@/features/users/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function PeoplePage() {
  const actor = await requirePagePermission("user.read");
  const initialTab = getPeopleTabConfig(DEFAULT_PEOPLE_TAB);
  const [page, president] = await Promise.all([
    getUserManagementPage({
      pageSize: 10,
      ...(initialTab.role ? { role: initialTab.role } : {}),
      status: initialTab.status,
    }),
    getPresident(),
  ]);
  return (
    <UsersManagement
      initialRows={page.rows}
      initialCursor={page.nextCursor}
      currentUserId={actor.id}
      presidentName={president?.name ?? null}
    />
  );
}
