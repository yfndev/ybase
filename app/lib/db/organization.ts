export interface Organization {
  _id: string;
  _creationTime: number;
  name: string;
  domain: string;
  createdBy: string;
  street?: string;
  plz?: string;
  city?: string;
  accountingEmail?: string;
  careOf?: string;
  taxId?: string;
}
