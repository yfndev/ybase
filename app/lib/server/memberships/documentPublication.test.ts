import { createHash } from "node:crypto";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../s3/storage", () => ({
  putObject: vi.fn(),
  getObjectBuffer: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import { documentVersions } from "../../db/collections";
import { putObject } from "../../s3/storage";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { publishMembershipDocument } from "./documentPublication";

setupTestDatabase();

const CONTENT = `<h2>Datenschutz</h2><p>${"Wir verarbeiten deine Daten ausschliesslich fuer die Mitgliederverwaltung. ".repeat(
  3,
)}</p>`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId: "organization-1" }),
  );
  vi.mocked(putObject).mockResolvedValue(undefined);
});

function storedContent(): string {
  return Buffer.from(vi.mocked(putObject).mock.calls[0][1]).toString("utf8");
}

test("stores the document text in object storage and hashes it", async () => {
  const published = await publishMembershipDocument({
    kind: "privacy_notice",
    title: "Interne Datenschutzerklärung",
    versionLabel: "2026-01",
    content: CONTENT,
  });

  const [key, , contentType] = vi.mocked(putObject).mock.calls[0];
  expect(key).toBe(
    `memberships/organization-1/documents/${published.id}/content.html`,
  );
  expect(contentType).toContain("text/html");
  expect(published.sha256).toBe(
    createHash("sha256").update(storedContent(), "utf8").digest("hex"),
  );
  expect(
    await (await documentVersions()).findOne({ _id: published.id }),
  ).toMatchObject({
    organizationId: "organization-1",
    contentStorageKey: key,
    sha256: published.sha256,
    executionType: "acknowledgement",
    isActive: true,
  });
});

test("derives the execution type from the document kind", async () => {
  const published = await publishMembershipDocument({
    kind: "usage_rights",
    title: "Sondervereinbarung Arbeitsergebnisse",
    versionLabel: "2026-01",
    content: CONTENT,
    targetDepartmentIds: ["department-1"],
  });

  expect(
    await (await documentVersions()).findOne({ _id: published.id }),
  ).toMatchObject({ executionType: "signature" });
});

test("strips active markup from the published text", async () => {
  await publishMembershipDocument({
    kind: "bylaws",
    title: "Satzung",
    versionLabel: "2026-01",
    content: `${CONTENT}<script>alert(1)</script><img src=x onerror="alert(2)">`,
  });

  expect(storedContent()).not.toContain("script");
  expect(storedContent()).not.toContain("onerror");
});

test("requires a target department for the usage rights agreement", async () => {
  await expect(
    publishMembershipDocument({
      kind: "usage_rights",
      title: "Sondervereinbarung Arbeitsergebnisse",
      versionLabel: "2026-01",
      content: CONTENT,
    }),
  ).rejects.toThrow();

  expect(putObject).not.toHaveBeenCalled();
  expect(await (await documentVersions()).countDocuments()).toBe(0);
});

test("rejects a text too short to be a legal document", async () => {
  await expect(
    publishMembershipDocument({
      kind: "bylaws",
      title: "Satzung",
      versionLabel: "2026-01",
      content: "<p>zu kurz</p>",
    }),
  ).rejects.toThrow("zu kurz");

  expect(putObject).not.toHaveBeenCalled();
});
