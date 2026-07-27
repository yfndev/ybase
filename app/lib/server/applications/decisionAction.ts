"use server";

import { ZodError } from "zod";
import type { ApplicationDecisionInput } from "./decisionInput";
import { sendApplicationDecision } from "./decision";

export type ApplicationDecisionResult =
  | { ok: true }
  | { ok: false; error: string };

const DISPLAYABLE_DECISION_ERRORS = new Set([
  "Bewerbung nicht gefunden",
  "Dieser Statuswechsel ist nicht zulässig",
  "Das Workspace-Konto wird bereits eingerichtet",
  "Ausschreibung nicht gefunden",
  "YBase-URL ist nicht konfiguriert",
  "Diese Workspace-E-Mail ist bereits einer Bewerbung zugeordnet",
  "Diese Workspace-E-Mail gehört bereits zu einem YBase-Profil",
  "Diese Workspace-E-Mail ist bereits vergeben",
  "Das Workspace-Konto verwendet eine andere E-Mail",
  "Google-Workspace-Integration ist nicht konfiguriert",
  "Google-Workspace-Konfiguration ist ungültig",
  "Google-Workspace-Admin ist nicht konfiguriert",
  "Google-Workspace-Domaindelegierung ist nicht autorisiert",
  "Google-Workspace-Authentifizierung fehlgeschlagen",
  "Google hat kein Zugriffstoken zurückgegeben",
  "Google Workspace hat die Kontoerstellung nicht autorisiert",
  "Google Workspace-Konto konnte nicht erstellt werden",
  "Workspace-Konto konnte nicht gespeichert werden",
  "E-Mail konnte nicht versendet werden",
  "Bewerbung wurde zwischenzeitlich geändert",
]);

function decisionErrorMessage(
  error: unknown,
  decision: ApplicationDecisionInput["decision"],
): string {
  if (error instanceof ZodError) {
    return "Prüfe die YFN-E-Mail, den Betreff und die Nachricht.";
  }
  if (
    error instanceof Error &&
    (DISPLAYABLE_DECISION_ERRORS.has(error.message) ||
      /^Die Workspace-E-Mail muss auf @[^ ]+ enden$/.test(error.message))
  ) {
    return error.message;
  }
  return decision === "accepted"
    ? "Die Zusage konnte nicht gesendet werden. Bitte versuche es erneut."
    : "Die Absage konnte nicht gesendet werden. Bitte versuche es erneut.";
}

export async function submitApplicationDecision(
  input: ApplicationDecisionInput,
): Promise<ApplicationDecisionResult> {
  try {
    await sendApplicationDecision(input);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: decisionErrorMessage(error, input.decision),
    };
  }
}
