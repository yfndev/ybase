import { organizations, projects, users } from "../db/collections";
import { newId } from "../db/ids";
import type { User } from "../db/types";
import { YFN_ORGANIZATION } from "../organization";
import { tryRefreshMemberPlatformProfile } from "../server/memberPlatform/sync";
import { linkAcceptedApplication } from "./applicationLinking";

type SignInProfile = {
  email: string;
  googleWorkspaceUserId?: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  googlePhotoIsDefault?: boolean;
};
export async function ensureAppUser(profile: SignInProfile): Promise<User> {
  const usersCol = await users();
  const normalizedEmail = profile.email.trim().toLowerCase();
  const googleWorkspaceUserId = profile.googleWorkspaceUserId?.trim();

  const [emailUser, workspaceUser] = await Promise.all([
    usersCol.findOne({ email: normalizedEmail }),
    googleWorkspaceUserId
      ? usersCol.findOne({ googleWorkspaceUserId })
      : Promise.resolve(null),
  ]);
  if (emailUser && workspaceUser && emailUser._id !== workspaceUser._id) {
    throw new Error("Google Workspace account is linked to another user");
  }

  let user = workspaceUser ?? emailUser;
  if (!user) {
    const now = Date.now();
    user = {
      _id: newId(),
      _creationTime: now,
      email: normalizedEmail,
      name: profile.name,
      image: profile.image,
      googlePhotoIsDefault: profile.googlePhotoIsDefault,
      publicProfileSetupRequired: true,
      firstName: profile.firstName,
      lastName: profile.lastName,
      googleWorkspaceUserId,
      emailVerificationTime: now,
      memberStatus: "onboarding",
      teamOnboardingStatus: "not_started",
      registeredAt: now,
    };
    await usersCol.insertOne(user);
  } else {
    if (
      googleWorkspaceUserId &&
      user.googleWorkspaceUserId &&
      googleWorkspaceUserId !== user.googleWorkspaceUserId
    ) {
      throw new Error("User is linked to another Google Workspace account");
    }
    const profileUpdates = {
      ...(normalizedEmail !== user.email ? { email: normalizedEmail } : {}),
      ...(googleWorkspaceUserId &&
      googleWorkspaceUserId !== user.googleWorkspaceUserId
        ? { googleWorkspaceUserId }
        : {}),
      ...(profile.name && profile.name !== user.name
        ? { name: profile.name }
        : {}),
      ...(profile.image && profile.image !== user.image
        ? { image: profile.image }
        : {}),
      ...(profile.firstName && profile.firstName !== user.firstName
        ? { firstName: profile.firstName }
        : {}),
      ...(profile.lastName && profile.lastName !== user.lastName
        ? { lastName: profile.lastName }
        : {}),
      ...(profile.googlePhotoIsDefault !== undefined &&
      profile.googlePhotoIsDefault !== user.googlePhotoIsDefault
        ? { googlePhotoIsDefault: profile.googlePhotoIsDefault }
        : {}),
    };

    const restoresDeletedWorkspaceAccount = Boolean(
      googleWorkspaceUserId && user.workspaceAccountDeletedAt,
    );
    if (
      Object.keys(profileUpdates).length > 0 ||
      restoresDeletedWorkspaceAccount
    ) {
      await usersCol.updateOne(
        { _id: user._id },
        {
          ...(Object.keys(profileUpdates).length > 0
            ? { $set: profileUpdates }
            : {}),
          ...(restoresDeletedWorkspaceAccount
            ? { $unset: { workspaceAccountDeletedAt: "" } }
            : {}),
        },
      );
      user = {
        ...user,
        ...profileUpdates,
        ...(restoresDeletedWorkspaceAccount
          ? { workspaceAccountDeletedAt: undefined }
          : {}),
      };
    }
  }

  if (isYfnEmail(normalizedEmail)) {
    const organization = await ensureYfnOrganization(user._id);
    const role =
      user.organizationId === organization.id
        ? (user.role ?? ("member" as const))
        : ("member" as const);
    const membership = organization.isNew
      ? {
          organizationId: organization.id,
          role: "admin" as const,
          memberStatus: "active" as const,
          teamOnboardingStatus: "completed" as const,
          onboardedAt: Date.now(),
          teamOnboardedAt: Date.now(),
        }
      : {
          organizationId: organization.id,
          role,
        };

    await usersCol.updateOne({ _id: user._id }, { $set: membership });
    user = { ...user, ...membership };
  }

  return tryRefreshMemberPlatformProfile(await linkAcceptedApplication(user));
}

export async function isLinkedWorkspaceUser(
  googleWorkspaceUserId: string | undefined,
): Promise<boolean> {
  const normalizedId = googleWorkspaceUserId?.trim();
  if (!normalizedId) return false;
  const user = await (
    await users()
  ).findOne(
    { googleWorkspaceUserId: normalizedId },
    { projection: { _id: 1 } },
  );
  return Boolean(user);
}

function isYfnEmail(email: string): boolean {
  return email.endsWith(`@${YFN_ORGANIZATION.domain}`);
}

async function ensureYfnOrganization(
  createdBy: string,
): Promise<{ id: string; isNew: boolean }> {
  const candidateId = newId();
  const result = await (
    await organizations()
  ).updateOne(
    { domain: YFN_ORGANIZATION.domain },
    {
      $setOnInsert: {
        _id: candidateId,
        _creationTime: Date.now(),
        createdBy,
        ...YFN_ORGANIZATION,
      },
    },
    { upsert: true },
  );
  const id = result.upsertedId ?? (await findYfnOrganizationId());
  if (!id) throw new Error("YFN organization could not be provisioned");

  if (result.upsertedCount === 1) {
    await (
      await projects()
    ).insertOne({
      _id: newId(),
      _creationTime: Date.now(),
      name: "Allgemein",
      organizationId: id,
      isArchived: false,
      createdBy,
    });
  }

  return { id, isNew: result.upsertedCount === 1 };
}

async function findYfnOrganizationId(): Promise<string | undefined> {
  const organization = await (
    await organizations()
  ).findOne({ domain: YFN_ORGANIZATION.domain }, { projection: { _id: 1 } });
  return organization?._id;
}
