import { appendWorkspaceAccessDetails } from "../../applications/decisionEmail";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { appUrl } from "../../email/urls";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { YFN_ORGANIZATION } from "../../organization";

interface ManualWorkspaceProvisioningInput {
  name: string;
  primaryEmail: string;
  privateEmail: string;
}

export async function provisionManualMemberWorkspace(
  input: ManualWorkspaceProvisioningInput,
): Promise<{ userId: string }> {
  const loginUrl = appUrl("/login");
  const { givenName, familyName } = workspaceMemberName(
    input.name,
    input.primaryEmail,
  );
  const account = await provisionWorkspaceUser({
    applicationId: manualWorkspaceProvisioningId(input.primaryEmail),
    primaryEmail: input.primaryEmail,
    recoveryEmail: input.privateEmail,
    givenName,
    familyName,
  });
  const message = appendWorkspaceAccessDetails({
    message: `Hey ${givenName},\n\nwillkommen bei ${YFN_ORGANIZATION.name}. Dein Google-Workspace-Konto wurde für dein Onboarding eingerichtet.`,
    primaryEmail: account.primaryEmail,
    temporaryPassword: account.temporaryPassword,
    loginUrl,
  });
  const delivery = await sendMail({
    to: [{ email: input.privateEmail, name: input.name }],
    templateId: BREVO_TEMPLATE_IDS.APPLICATION_ACCEPTED,
    subject: "Deine Zugangsdaten für YFN",
    params: {
      applicantName: input.name,
      jobTitle: "Mitglied",
      organizationName: YFN_ORGANIZATION.name,
      message,
    },
    tags: ["ybase", "member", "manual-onboarding"],
  });
  if (delivery.status !== "sent") {
    throw new Error("Zugangsdaten konnten nicht versendet werden");
  }

  return { userId: account.userId };
}

function manualWorkspaceProvisioningId(primaryEmail: string): string {
  return `manual-member:${primaryEmail.trim().toLowerCase()}`;
}

function workspaceMemberName(
  name: string,
  primaryEmail: string,
): { givenName: string; familyName: string } {
  const fallback = primaryEmail.split("@")[0] || "Mitglied";
  const parts = (name.trim() || fallback).split(/\s+/);
  return {
    givenName: parts[0],
    familyName: parts.slice(1).join(" ") || parts[0],
  };
}
