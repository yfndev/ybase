import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requirePermission: vi.fn(),
}));
vi.mock("../tally/client", () => ({
  createConfiguredTallyClient: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import { TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID } from "../../tally/constants";
import { createTestActor } from "../../test/fixtures";
import { createConfiguredTallyClient } from "../tally/client";
import {
  getRecruitingTallyTemplates,
  requireRecruitingTallyTemplate,
} from "./tallyTemplates";

const listFolders = vi.fn();
const listForms = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({
      _id: "user-1",
      organizationId: "org-1",
      role: "people_culture",
    }),
  );
  vi.mocked(createConfiguredTallyClient).mockReturnValue({
    listFolders,
    listForms,
  } as unknown as ReturnType<typeof createConfiguredTallyClient>);
  listFolders.mockResolvedValue([
    {
      id: "templates",
      name: "Vorlagen",
      workspaceId: TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
      parentId: null,
    },
    {
      id: "nested",
      name: "Marketing",
      workspaceId: TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
      parentId: "templates",
    },
    {
      id: "other",
      name: "Andere",
      workspaceId: TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
      parentId: null,
    },
  ]);
  listForms.mockResolvedValue([
    {
      id: "marketing",
      name: "Vorlage Marketing",
      status: "PUBLISHED",
      workspaceId: TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
      folderId: "nested",
    },
    {
      id: "general",
      name: "Vorlage Allgemein",
      status: "DRAFT",
      workspaceId: TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
      folderId: "templates",
    },
    {
      id: "foreign",
      name: "Kein Template",
      status: "PUBLISHED",
      workspaceId: TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
      folderId: "other",
    },
  ]);
});

test("lists non-deleted forms in the templates folder and descendants", async () => {
  await expect(getRecruitingTallyTemplates()).resolves.toEqual([
    { id: "general", name: "Vorlage Allgemein" },
    { id: "marketing", name: "Vorlage Marketing" },
  ]);
  expect(requirePermission).toHaveBeenCalledWith("manage_recruiting");
  expect(listFolders).toHaveBeenCalledWith(
    TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
  );
  expect(listForms).toHaveBeenCalledWith(
    TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
  );
});

test("accepts only a form from the templates folder", async () => {
  await expect(requireRecruitingTallyTemplate("marketing")).resolves.toEqual({
    id: "marketing",
    name: "Vorlage Marketing",
  });
  await expect(requireRecruitingTallyTemplate("foreign")).rejects.toThrow(
    "Tally-Vorlage nicht verfügbar",
  );
});

test("fails when the templates folder is missing", async () => {
  listFolders.mockResolvedValue([]);

  await expect(getRecruitingTallyTemplates()).rejects.toThrow(
    "Tally-Ordner „Vorlagen“",
  );
});
