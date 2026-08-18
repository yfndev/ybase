import { getOwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";
import { MembershipPage } from "./MembershipPage";

export default async function OwnMembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ resign?: string }>;
}) {
  const { resign } = await searchParams;
  const membership = await getOwnMembershipOverview();
  return (
    <MembershipPage membership={membership} openResignation={resign === "1"} />
  );
}
