export interface Log {
  _id: string;
  _creationTime: number;
  organizationId: string;
  userId: string;
  action: string;
  entityId: string;
  details?: string;
}
