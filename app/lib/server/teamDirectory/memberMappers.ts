import type { Department, User } from "../../db/types";
import type { TeamDirectoryBoardMember, TeamDirectoryMember } from "./types";

export type DirectoryUser = Pick<
  User,
  | "_id"
  | "name"
  | "teamId"
  | "isTeamLead"
  | "boardMembership"
  | "profileImageStorageKey"
  | "publicProfileCompletedAt"
>;

export const byName = (left: { name: string }, right: { name: string }) =>
  left.name.localeCompare(right.name, "de");

export const byLeadAndName = (
  left: TeamDirectoryMember,
  right: TeamDirectoryMember,
) => Number(right.isLead) - Number(left.isLead) || byName(left, right);

export const byBoardRole = (
  left: TeamDirectoryBoardMember,
  right: TeamDirectoryBoardMember,
) =>
  Number(right.isChair) - Number(left.isChair) ||
  left.role.localeCompare(right.role, "de") ||
  byName(left, right);

export function profileName(user: DirectoryUser): string {
  return user.name?.trim() ?? "";
}

function memberId(organizationId: string, userId: string): string {
  return `ybase:${organizationId}:member:${userId}`;
}

export function memberDto(
  user: DirectoryUser,
  organizationId: string,
  publicOrigin: string,
): TeamDirectoryMember {
  const isLead = user.isTeamLead ?? false;
  return {
    id: memberId(organizationId, user._id),
    name: profileName(user),
    role: isLead ? "Lead" : "",
    isLead,
    ...(user.profileImageStorageKey && user.publicProfileCompletedAt
      ? {
          imageUrl: `${publicOrigin}/api/v1/team-directory/images/${encodeURIComponent(user._id)}`,
        }
      : {}),
  };
}

export function boardMemberDto(
  user: DirectoryUser,
  organizationId: string,
  department: Pick<Department, "_id" | "name"> | undefined,
): TeamDirectoryBoardMember | null {
  const boardMembership = user.boardMembership;
  const name = profileName(user);
  if (!boardMembership || !department || !name) return null;

  return {
    id: memberId(organizationId, user._id),
    departmentId: `ybase:${organizationId}:department:${department._id}`,
    name,
    role: department.name,
    isChair: boardMembership.isChair,
  };
}
