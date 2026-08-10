import { emailDomain, normalizeYfnEmail } from "../../applications/yfnEmail";
import { applications, users } from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import type { Application } from "../../db/types";

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

export function workspaceApplicantName(application: Application): {
  givenName: string;
  familyName: string;
} {
  const fallback = application.applicantEmail.split("@")[0] || "Mitglied";
  const parts = (application.applicantName?.trim() || fallback).split(/\s+/);
  return {
    givenName: parts[0],
    familyName: parts.slice(1).join(" ") || parts[0],
  };
}

export async function reserveWorkspaceProvisioning(input: {
  application: Application;
  organizationDomain: string;
  yfnEmail: string;
}): Promise<{ existingWorkspaceUserId?: string; yfnEmail: string }> {
  const yfnEmail = normalizeYfnEmail(input.yfnEmail);
  if (emailDomain(yfnEmail) !== input.organizationDomain.toLowerCase()) {
    throw new Error(
      `Die Workspace-E-Mail muss auf @${input.organizationDomain} enden`,
    );
  }

  const [existingApplication, existingUser] = await Promise.all([
    (await applications()).findOne({
      _id: { $ne: input.application._id },
      yfnEmailNormalized: yfnEmail,
    }),
    (await users()).findOne({ email: yfnEmail }),
  ]);
  if (existingApplication) {
    throw new Error(
      "Diese Workspace-E-Mail ist bereits einer Bewerbung zugeordnet",
    );
  }
  if (existingUser) {
    throw new Error(
      "Diese Workspace-E-Mail gehört bereits zu einem YBase-Profil",
    );
  }

  const startedAt = Date.now();
  try {
    const result = await (
      await applications()
    ).updateOne(
      {
        _id: input.application._id,
        organizationId: input.application.organizationId,
        status: input.application.status,
        $or: [
          { workspaceProvisioningStatus: { $exists: false } },
          { workspaceProvisioningStatus: { $in: ["failed", "provisioned"] } },
          {
            workspaceProvisioningStatus: "pending",
            workspaceProvisioningStartedAt: {
              $lt: startedAt - CLAIM_TIMEOUT_MS,
            },
          },
        ],
      },
      {
        $set: {
          yfnEmail,
          yfnEmailNormalized: yfnEmail,
          workspaceProvisioningStatus: "pending",
          workspaceProvisioningStartedAt: startedAt,
          updatedAt: startedAt,
        },
        $unset: { workspaceProvisioningError: "" },
      },
    );
    if (result.modifiedCount !== 1) {
      throw new Error("Das Workspace-Konto wird bereits eingerichtet");
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error("Diese Workspace-E-Mail ist bereits vergeben");
    }
    throw error;
  }

  return {
    existingWorkspaceUserId: input.application.workspaceUserId,
    yfnEmail,
  };
}

export async function recordWorkspaceProvisioned(input: {
  applicationId: string;
  organizationId: string;
  workspaceUserId: string;
}): Promise<void> {
  const timestamp = Date.now();
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: input.applicationId,
      organizationId: input.organizationId,
      workspaceProvisioningStatus: "pending",
    },
    {
      $set: {
        workspaceUserId: input.workspaceUserId,
        workspaceProvisioningStatus: "provisioned",
        workspaceProvisionedAt: timestamp,
        updatedAt: timestamp,
      },
      $unset: { workspaceProvisioningError: "" },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Workspace-Konto konnte nicht gespeichert werden");
  }
}

export async function recordWorkspaceProvisioningFailure(input: {
  applicationId: string;
  organizationId: string;
  error: unknown;
}): Promise<void> {
  const message =
    input.error instanceof Error
      ? input.error.message
      : "Google Workspace-Konto konnte nicht erstellt werden";
  await (
    await applications()
  ).updateOne(
    {
      _id: input.applicationId,
      organizationId: input.organizationId,
      workspaceProvisioningStatus: "pending",
    },
    {
      $set: {
        workspaceProvisioningStatus: "failed",
        workspaceProvisioningError: message,
        updatedAt: Date.now(),
      },
    },
  );
}

export async function recordWorkspaceDeliveryFailure(input: {
  applicationId: string;
  organizationId: string;
}): Promise<void> {
  await (
    await applications()
  ).updateOne(
    {
      _id: input.applicationId,
      organizationId: input.organizationId,
      workspaceProvisioningStatus: "provisioned",
    },
    {
      $set: {
        workspaceProvisioningError:
          "Workspace-Konto erstellt, Zugangsdaten nicht versendet",
        updatedAt: Date.now(),
      },
    },
  );
}
