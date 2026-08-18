export interface LegalDelivery {
  channel: "email" | "letter";
  recipient: string;
  messageId?: string;
  sentAt?: number;
  deliveredAt?: number;
  evidenceStorageKey?: string;
}
