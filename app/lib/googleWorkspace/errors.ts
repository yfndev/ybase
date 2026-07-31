const DISPLAYABLE_WORKSPACE_ERRORS = new Set([
  "Google-Workspace-Integration ist nicht konfiguriert",
  "Google-Workspace-Konfiguration ist ungültig",
  "Google-Workspace-Admin ist nicht konfiguriert",
  "Google-Workspace-Domaindelegierung ist nicht autorisiert",
  "Google-Workspace-Authentifizierung fehlgeschlagen",
  "Google hat kein Zugriffstoken zurückgegeben",
]);

export function isDisplayableWorkspaceError(error: unknown): error is Error {
  return (
    error instanceof Error && DISPLAYABLE_WORKSPACE_ERRORS.has(error.message)
  );
}
