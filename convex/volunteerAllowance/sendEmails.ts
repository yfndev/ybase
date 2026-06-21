import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const CELL_STYLE = "padding: 8px; border-bottom: 1px solid #eee;";

export const sendApprovalEmail = internalAction({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");

    const data = await ctx.runQuery(internal.volunteerAllowance.queries.getWithDetails, { id: args.id });
    if (!data) return;
    if (!data.organization.accountingEmail) return;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "YBase <info@youngfounders.network>",
      to: [data.organization.accountingEmail],
      cc: data.creator.email ? [data.creator.email] : [],
      subject: `Ehrenamtspauschale genehmigt: ${data.volunteerName} - ${data.amount.toFixed(2)}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Ehrenamtspauschale genehmigt</h2>
          <p>Eine Ehrenamtspauschale wurde genehmigt und ist zur Auszahlung freigegeben.</p>

          <h3 style="color: #555; margin-top: 24px;">Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="${CELL_STYLE}"><strong>Ehrenamtliche/r:</strong></td><td style="${CELL_STYLE}">${data.volunteerName}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Projekt:</strong></td><td style="${CELL_STYLE}">${data.project.name}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Tätigkeit:</strong></td><td style="${CELL_STYLE}">${data.activityDescription}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Zeitraum:</strong></td><td style="${CELL_STYLE}">${data.startDate} – ${data.endDate}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Betrag:</strong></td><td style="${CELL_STYLE}"><strong>${data.amount.toFixed(2)}€</strong></td></tr>
          </table>

          <h3 style="color: #555; margin-top: 24px;">Bankverbindung</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="${CELL_STYLE}"><strong>Kontoinhaber:</strong></td><td style="${CELL_STYLE}">${data.accountHolder}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>IBAN:</strong></td><td style="${CELL_STYLE}">${data.iban}</td></tr>
            ${data.bic ? `<tr><td style="${CELL_STYLE}"><strong>BIC:</strong></td><td style="${CELL_STYLE}">${data.bic}</td></tr>` : ""}
          </table>
        </div>
      `,
    });
  },
});

export const sendRejectionEmail = internalAction({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");

    const data = await ctx.runQuery(internal.volunteerAllowance.queries.getWithDetails, { id: args.id });
    if (!data) return;
    if (!data.organization.accountingEmail) return;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "YBase <info@youngfounders.network>",
      to: [data.organization.accountingEmail],
      cc: data.creator.email ? [data.creator.email] : [],
      subject: `Ehrenamtspauschale abgelehnt: ${data.volunteerName} - ${data.amount.toFixed(2)}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c;">Ehrenamtspauschale abgelehnt</h2>
          <p>Eine Ehrenamtspauschale wurde abgelehnt.</p>

          <h3 style="color: #555; margin-top: 24px;">Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="${CELL_STYLE}"><strong>Ehrenamtliche/r:</strong></td><td style="${CELL_STYLE}">${data.volunteerName}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Projekt:</strong></td><td style="${CELL_STYLE}">${data.project.name}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Betrag:</strong></td><td style="${CELL_STYLE}">${data.amount.toFixed(2)}€</td></tr>
          </table>

          <h3 style="color: #555; margin-top: 24px;">Ablehnungsgrund</h3>
          <div style="background: #fef2f2; border-left: 4px solid #b91c1c; padding: 12px 16px; border-radius: 4px;">
            ${data.rejectionNote ?? "Kein Grund angegeben"}
          </div>
        </div>
      `,
    });
  },
});
