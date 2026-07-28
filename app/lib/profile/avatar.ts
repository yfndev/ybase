import type { User } from "../db/types";

type AvatarUser = Pick<
  User,
  "_id" | "image" | "profileImageStorageKey" | "publicProfileCompletedAt"
>;

export function profileAvatarUrl(user: AvatarUser): string | undefined {
  if (!user.profileImageStorageKey) return user.image;
  const version = user.publicProfileCompletedAt ?? 1;
  return `/api/profile-images/${encodeURIComponent(user._id)}?v=${version}`;
}
