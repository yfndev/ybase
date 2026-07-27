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
