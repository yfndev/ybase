import { organizations, users } from "../db/collections";
import { newId } from "../db/ids";
import type { User } from "../db/types";

type SignInProfile = {
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
};

export async function ensureAppUser(profile: SignInProfile): Promise<User> {
  const usersCol = await users();

  let user = await usersCol.findOne({ email: profile.email });
  if (!user) {
    const now = Date.now();
    user = {
      _id: newId(),
      _creationTime: now,
      email: profile.email,
      name: profile.name,
      image: profile.image,
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
    };

    if (Object.keys(profileUpdates).length > 0) {
      await usersCol.updateOne({ _id: user._id }, { $set: profileUpdates });
      user = { ...user, ...profileUpdates };
    }
  }

  if (!user.organizationId) {
    const organizationId = await findOrgIdByDomain(profile.email);
    if (organizationId) {
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { organizationId, role: "member" } },
      );
      user.organizationId = organizationId;
      user.role = "member";
    }
  }

  return user;
}

async function findOrgIdByDomain(email: string): Promise<string | undefined> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;
  const org = await (await organizations()).findOne({ domain });
  return org?._id;
}
