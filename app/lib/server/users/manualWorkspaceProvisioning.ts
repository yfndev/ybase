import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { requireTeamWelcomeTemplateId, sendTeamWelcomeEmail } from "./email";

interface ManualWorkspaceProvisioningInput {
  name: string;
  primaryEmail: string;
  privateEmail: string;
}

export async function provisionManualMemberWorkspace(
  input: ManualWorkspaceProvisioningInput,
): Promise<{ userId: string }> {
  requireTeamWelcomeTemplateId();
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
  await sendTeamWelcomeEmail({
    recoveryEmail: input.privateEmail,
    memberName: input.name,
    workspaceEmail: account.primaryEmail,
    temporaryPassword: account.temporaryPassword,
  });

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
