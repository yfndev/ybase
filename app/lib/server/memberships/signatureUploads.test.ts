import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireAuthenticatedUser: vi.fn(),
  requireUser: vi.fn(),
}));
vi.mock("../../s3/storage", () => ({
  presignDownload: vi.fn(async () => "https://signed.example/signature"),
  presignUpload: vi.fn(async () => ({
    key: "membership-signature-key",
    url: "https://upload.example/signature",
  })),
}));

import { requireAuthenticatedUser } from "../../auth/session";
import { signatureTokens, uploadOwnerships } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { presignUpload } from "../../s3/storage";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { createToken } from "../signatures/actions";
import { createPublicSignatureUpload } from "../signatures/public";
import {
  createMembershipSignatureUpload,
  getMembershipSignatureUrl,
} from "./signatureUploads";

setupTestDatabase();

let actor: User & { organizationId: string };

beforeEach(() => {
  vi.clearAllMocks();
  actor = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: newId(),
    memberPlatformUserId: "member-platform-profile",
    name: "Alex Beispiel",
    email: "alex@example.org",
    role: "member",
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
  };
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
});

test("creates and previews an owned onboarding signature upload", async () => {
  const upload = await createMembershipSignatureUpload("image/png");

  expect(presignUpload).toHaveBeenCalledWith(
    "image/png",
    `memberships/${actor.organizationId}/signature-uploads/${actor._id}`,
  );
  expect(
    await (await uploadOwnerships()).findOne({ _id: upload.key }),
  ).toMatchObject({
    organizationId: actor.organizationId,
    userId: actor._id,
    contextType: "user",
  });
  await expect(getMembershipSignatureUrl(upload.key)).resolves.toBe(
    "https://signed.example/signature",
  );
});

test("uses the onboarding upload directory for mobile signatures", async () => {
  const token = await createToken("membership-onboarding");

  await createPublicSignatureUpload(token, "image/png");

  expect(presignUpload).toHaveBeenCalledWith(
    "image/png",
    `memberships/${actor.organizationId}/signature-uploads/${actor._id}`,
  );
  expect(await (await signatureTokens()).findOne({ token })).toMatchObject({
    uploadContext: "membership-onboarding",
    pendingSignatureStorageId: "membership-signature-key",
  });
});

test("does not preview another user's upload", async () => {
  await expect(getMembershipSignatureUrl("foreign-key")).rejects.toThrow(
    "nicht gefunden",
  );
});
