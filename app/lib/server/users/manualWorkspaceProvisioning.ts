import { appUrl } from "../../email/urls";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import {
  requireWorkspaceAccountReadyTemplateId,
  sendUserStateEmail,
  sendWorkspaceAccountReadyEmail,
} from "./email";

interface ManualWorkspaceProvisioningInput {
  name: string;
  primaryEmail: string;
  privateEmail: string;
}

export async function provisionManualMemberWorkspace(
  input: ManualWorkspaceProvisioningInput,
): Promise<{ userId: string }> {
  requireWorkspaceAccountReadyTemplateId();
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
  await sendWorkspaceAccountReadyEmail({
    recoveryEmail: input.privateEmail,
    applicantName: input.name,
    workspaceEmail: account.primaryEmail,
    temporaryPassword: account.temporaryPassword,
    loginUrl,
  });
  await sendUserStateEmail({
    user: {
      name: input.name,
      email: input.primaryEmail,
      privateEmail: input.privateEmail,
    },
    event: "team_onboarding_started",
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
