import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../s3/storage", () => ({ putObject: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { documentVersions } from "../../db/collections";
import { newId } from "../../db/ids";
import { putObject } from "../../s3/storage";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { publishMembershipDocument } from "./documentPublication";

setupTestDatabase();

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId: "organization-1" }),
  );
  vi.mocked(putObject).mockResolvedValue(undefined);
});

afterEach(() => vi.unstubAllGlobals());

test("freezes and hashes an allowed PDF source", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(Uint8Array.from(bytes).buffer, {
        status: 200,
        headers: { "content-length": String(bytes.byteLength) },
      }),
    ),
  );

  const published = await publishMembershipDocument({
    kind: "privacy_notice",
    title: "Datenschutzhinweise",
    versionLabel: "2026-01",
    sourceUrl: "https://docs.google.com/document.pdf",
    executionType: "acknowledgement",
  });

  const hash = createHash("sha256").update(bytes).digest("hex");
  expect(published.sha256).toBe(hash);
  expect(putObject).toHaveBeenCalledWith(
    `memberships/organization-1/documents/${published.id}/snapshot.pdf`,
    bytes,
    "application/pdf",
  );
  expect(
    await (await documentVersions()).findOne({ _id: published.id }),
  ).toMatchObject({
    organizationId: "organization-1",
    sha256: hash,
    snapshotStorageKey: expect.stringContaining(published.id),
    isActive: true,
  });
});

test("rejects document sources outside the configured host allowlist", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    publishMembershipDocument({
      kind: "code_of_conduct",
      title: "Code of Conduct",
      versionLabel: newId(),
      sourceUrl: "https://example.org/document.pdf",
      executionType: "signature",
    }),
  ).rejects.toThrow("nicht freigegeben");

  expect(fetchMock).not.toHaveBeenCalled();
  expect(putObject).not.toHaveBeenCalled();
  expect(await (await documentVersions()).countDocuments()).toBe(0);
});

test("rejects oversized sources before storing a snapshot", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("%PDF-", {
        status: 200,
        headers: { "content-length": "10000001" },
      }),
    ),
  );

  await expect(
    publishMembershipDocument({
      kind: "bylaws",
      title: "Satzung",
      versionLabel: "2026-01",
      sourceUrl: "https://docs.google.com/bylaws.pdf",
      executionType: "acknowledgement",
    }),
  ).rejects.toThrow("zu groß");

  expect(putObject).not.toHaveBeenCalled();
  expect(await (await documentVersions()).countDocuments()).toBe(0);
});
