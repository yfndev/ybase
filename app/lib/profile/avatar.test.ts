import { expect, test } from "vitest";
import { profileAvatarUrl } from "./avatar";

test("uses the stored ybase profile image before a remote URL", () => {
  expect(
    profileAvatarUrl({
      _id: "member/id",
      image: "https://example.com/old-avatar.jpg",
      profileImageStorageKey: "profile-images/member/image",
      publicProfileCompletedAt: 123,
    }),
  ).toBe("/api/profile-images/member%2Fid?v=123");
});

test("falls back to the remote URL when no stored image exists", () => {
  expect(
    profileAvatarUrl({
      _id: "member-id",
      image: "https://example.com/current-avatar.jpg",
    }),
  ).toBe("https://example.com/current-avatar.jpg");
});

test("returns no source when the profile has no image", () => {
  expect(profileAvatarUrl({ _id: "member-id" })).toBeUndefined();
});
