export interface TallyBlock {
  uuid: string;
  type: string;
  groupUuid: string;
  groupType: string;
  payload?: Record<string, unknown>;
}

export interface TallyForm {
  id: string;
  status: string;
  workspaceId: string;
  blocks: TallyBlock[];
  settings: Record<string, unknown>;
}

export interface TallyFormSummary {
  id: string;
  name: string;
  status: string;
  workspaceId: string;
  folderId?: string | null;
}

export interface TallyFolder {
  id: string;
  name: string;
  workspaceId: string;
  parentId: string | null;
}

export interface TallyTemplateOption {
  id: string;
  name: string;
}
