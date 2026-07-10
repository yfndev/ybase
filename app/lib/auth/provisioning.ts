import { organizations, users } from "../db/collections";
import { newId } from "../db/ids";
import type { User } from "../db/types";
import { isLegacyLeadRole } from "./roles";

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
    user = {
      _id: newId(),
      _creationTime: Date.now(),
      email: profile.email,
      name: profile.name,
      image: profile.image,
      firstName: profile.firstName,
      lastName: profile.lastName,
      emailVerificationTime: Date.now(),
    };
    await usersCol.insertOne(user);
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

  if (isLegacyLeadRole(user.role)) {
    await usersCol.updateOne({ _id: user._id }, { $set: { role: "admin" } });
    user.role = "admin";
  }

  return user;
}

async function findOrgIdByDomain(email: string): Promise<string | undefined> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;
  const org = await (await organizations()).findOne({ domain });
  return org?._id;
}
