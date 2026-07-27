import { organizations, users } from "../db/collections";
import { newId } from "../db/ids";
import type { User } from "../db/types";
import { linkAcceptedApplication } from "./applicationLinking";

type SignInProfile = {
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  googlePhotoIsDefault?: boolean;
};

export async function ensureAppUser(profile: SignInProfile): Promise<User> {
  const usersCol = await users();
  const normalizedEmail = profile.email.trim().toLowerCase();

  let user = await usersCol.findOne({ email: normalizedEmail });
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
      emailVerificationTime: now,
      memberStatus: "onboarding",
      teamOnboardingStatus: "not_started",
      registeredAt: now,
    };
    await usersCol.insertOne(user);
  } else {
    const profileUpdates = {
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

    if (Object.keys(profileUpdates).length > 0) {
      await usersCol.updateOne({ _id: user._id }, { $set: profileUpdates });
      user = { ...user, ...profileUpdates };
    }
  }

  if (!user.organizationId) {
    const organizationId = await findOrgIdByDomain(normalizedEmail);
    if (organizationId) {
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { organizationId, role: "member" } },
      );
      user.organizationId = organizationId;
      user.role = "member";
    }
  }

  return linkAcceptedApplication(user);
}

async function findOrgIdByDomain(email: string): Promise<string | undefined> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;
  const org = await (await organizations()).findOne({ domain });
  return org?._id;
}
