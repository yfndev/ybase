import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import {
  TALLY_RECRUITING_TEMPLATE_FOLDER_NAME,
  TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID,
} from "../../tally/constants";
import type {
  TallyFolder,
  TallyFormSummary,
  TallyTemplateOption,
} from "../../tally/types";
import { createConfiguredTallyClient } from "../tally/client";

function folderAndDescendantIds(
  rootId: string,
  folders: TallyFolder[],
): Set<string> {
  const ids = new Set([rootId]);
  let addedFolder = true;
  while (addedFolder) {
    addedFolder = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        addedFolder = true;
      }
    }
  }
  return ids;
}

function templatesInFolder(
  folders: TallyFolder[],
  forms: TallyFormSummary[],
): TallyTemplateOption[] {
  const roots = folders.filter(
    (folder) =>
      folder.parentId === null &&
      folder.name.trim().toLocaleLowerCase("de-DE") ===
        TALLY_RECRUITING_TEMPLATE_FOLDER_NAME.toLocaleLowerCase("de-DE"),
  );
  if (roots.length !== 1) {
    throw new Error(
      `Der Tally-Ordner „${TALLY_RECRUITING_TEMPLATE_FOLDER_NAME}“ wurde nicht eindeutig gefunden`,
    );
  }

  const allowedFolderIds = folderAndDescendantIds(roots[0].id, folders);
  return forms
    .filter(
      (form) =>
        form.status !== "DELETED" &&
        Boolean(form.folderId && allowedFolderIds.has(form.folderId)),
    )
    .map(({ id, name }) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, "de-DE"));
}

async function loadRecruitingTallyTemplates(): Promise<TallyTemplateOption[]> {
  const client = createConfiguredTallyClient();
  const [folders, forms] = await Promise.all([
    client.listFolders(TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID),
    client.listForms(TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID),
  ]);
  return templatesInFolder(folders, forms);
}

export async function getRecruitingTallyTemplates(): Promise<
  TallyTemplateOption[]
> {
  await requirePermission(USER_PERMISSIONS.recruiting);
  return loadRecruitingTallyTemplates();
}

export async function requireRecruitingTallyTemplate(
  templateFormId: string,
): Promise<TallyTemplateOption> {
  const templates = await loadRecruitingTallyTemplates();
  const template = templates.find(({ id }) => id === templateFormId);
  if (!template) throw new Error("Tally-Vorlage nicht verfügbar");
  return template;
}
