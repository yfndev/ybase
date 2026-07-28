import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { isMemberStage } from "@/lib/members/stages";
import { MembersClient } from "../settings/members/MembersClient";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const session = await auth();
  const canManageRecruiting = hasPermission(
    session?.user?.role,
    USER_PERMISSIONS.recruiting,
  );
  const canManageMembers = hasPermission(
    session?.user?.role,
    USER_PERMISSIONS.members,
  );

  if (!canManageRecruiting || !canManageMembers) {
    return <AccessDenied title="Mitglieder" />;
  }

  const { stage } = await searchParams;
  return (
    <MembersClient initialStage={isMemberStage(stage) ? stage : undefined} />
  );
}
