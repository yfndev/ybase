export interface TallyWorkspace {
  id: string;
  name: string;
}

export interface TallyFormSummary {
  id: string;
  name: string;
  workspaceId: string;
  status: string;
}

export interface TallyQuestion {
  id: string;
  title: string;
  type: string;
}

export interface TallyResources {
  workspaces: TallyWorkspace[];
  forms: TallyFormSummary[];
}

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
