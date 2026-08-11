import { getOwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";
import { MembershipPage } from "./MembershipPage";

export default async function OwnMembershipPage() {
  const membership = await getOwnMembershipOverview();
  return <MembershipPage membership={membership} />;
}
