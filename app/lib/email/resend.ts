import { Resend } from "resend";

let client: Resend | null = null;

function resend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export type EmailAttachment = { filename: string; content: string };

export function sendEmail(message: {
  from: string;
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  return resend().emails.send(message);
}
