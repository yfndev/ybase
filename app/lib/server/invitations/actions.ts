"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { sendEmail } from "../../email/resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInvitation(input: {
  name: string;
  email: string;
}): Promise<void> {
  const user = await requireUser();
  const { name, email } = z
    .object({ name: z.string().min(1), email: z.string().email() })
    .parse(input);

  const firstName = escapeHtml(name.split(" ")[0]);
  const senderName = escapeHtml(user.firstName ?? "");

  await sendEmail({
    from: "YBase <info@youngfounders.network>",
    to: email,
    subject: "Einladung zu YBase",
    html: `
      <p>Hey ${firstName},</p>
      <p>Du wurdest von ${senderName} zu YBase eingeladen :) </p>
      <p>Klicke auf den folgenden Link, um dich einzuloggen:</p>
      <a href="https://ybase.de/login">Login</a>
      <p>Viel Spaß beim Budgeting!</p>
      `,
  });
}
