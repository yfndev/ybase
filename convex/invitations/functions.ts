import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const resend: Resend = new Resend(components.resend, {});

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendInvitation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const firstName = escapeHtml(args.name.split(" ")[0]);
    const senderName = escapeHtml(user.firstName ?? "");

    await resend.sendEmail(ctx, {
      from: "YBase <info@youngfounders.network>",
      to: args.email,
      subject: "Einladung zu YBase",
      html: `
      <p>Hey ${firstName},</p>
      <p>Du wurdest von ${senderName} zu YBase eingeladen :) </p>
      <p>Klicke auf den folgenden Link, um dich einzuloggen:</p>
      <a href="https://ybase.de/login">Login</a>
      <p>Viel Spaß beim Budgeting!</p>
      `,
    });
  },
});
