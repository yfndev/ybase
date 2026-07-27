export interface TeamDirectoryToken {
  _id: string;
  _creationTime: number;
  organizationId: string;
  tokenHash: string;
  rotatedAt: number;
  rotatedBy: string;
}
