import type { Department, User } from "../../db/types";
import type { TeamDirectoryBoardMember, TeamDirectoryMember } from "./types";

export type DirectoryUser = Pick<
  User,
  | "_id"
  | "name"
  | "email"
  | "teamId"
  | "secondaryTeamId"
  | "isTeamLead"
  | "isSecondaryTeamLead"
  | "boardMembership"
  | "profileImageStorageKey"
  | "publicProfileCompletedAt"
>;

export interface DirectoryContext {
  organizationId: string;
  publicOrigin: string;
  organizationDomain: string;
}

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

function profileImage(
  user: DirectoryUser,
  context: DirectoryContext,
): { imageUrl?: string } {
  return user.profileImageStorageKey && user.publicProfileCompletedAt
    ? {
        imageUrl: `${context.publicOrigin}/api/v1/team-directory/images/${encodeURIComponent(user._id)}`,
      }
    : {};
}

function organizationEmail(
  user: DirectoryUser,
  context: DirectoryContext,
): { email?: string } {
  const email = user.email?.trim().toLowerCase();
  const domain = context.organizationDomain.trim().toLowerCase();
  if (!email || !domain || !email.endsWith(`@${domain}`)) return {};
  return { email };
}

export function memberDto(
  user: DirectoryUser,
  context: DirectoryContext,
  isLead: boolean,
): TeamDirectoryMember {
  return {
    id: memberId(context.organizationId, user._id),
    name: profileName(user),
    role: isLead ? "Lead" : "",
    isLead,
    ...organizationEmail(user, context),
    ...profileImage(user, context),
  };
}

export function boardMemberDto(
  user: DirectoryUser,
  context: DirectoryContext,
  department: Pick<Department, "_id" | "name"> | undefined,
): TeamDirectoryBoardMember | null {
  const boardMembership = user.boardMembership;
  const name = profileName(user);
  if (!boardMembership || !department || !name) return null;

  return {
    id: memberId(context.organizationId, user._id),
    departmentId: `ybase:${context.organizationId}:department:${department._id}`,
    name,
    role: department.name,
    isChair: boardMembership.isChair,
    ...organizationEmail(user, context),
    ...profileImage(user, context),
  };
}
