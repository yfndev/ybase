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
