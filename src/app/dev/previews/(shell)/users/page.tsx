import { previewUsers } from "@/app/dev/previews/_data/preview-users";
import { UsersManagement } from "@/features/users/components/UsersManagement/UsersManagement";
import { OfficerPosition } from "@/generated/prisma/browser";

export default function UsersPreviewPage() {
  const president = previewUsers.find((user) => user.officerPosition === OfficerPosition.PRESIDENT);

  return (
    <UsersManagement
      initialRows={previewUsers}
      initialCursor={null}
      currentUserId="usr0000000000000000000001"
      presidentName={president?.name ?? null}
    />
  );
}
