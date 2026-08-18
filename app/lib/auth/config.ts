import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { YFN_ORGANIZATION } from "../organization";
import { getGooglePhotoIsDefault } from "./googlePeople";
import { ensureAppUser, isLinkedWorkspaceUser } from "./provisioning";
import { normalizeOptionalUserRole } from "./roles";

function isYfnEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${YFN_ORGANIZATION.domain}`));
}

const google = Google({
  authorization: {
    params: { prompt: "select_account", hd: YFN_ORGANIZATION.domain },
  },
  profile(profile) {
    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      firstName: profile.given_name ?? profile.name?.split(" ")[0] ?? "",
      lastName:
        profile.family_name ??
        profile.name?.split(" ").slice(1).join(" ") ??
        "",
    };
  },
});

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [google],
  callbacks: {
    async signIn({ user, account }) {
      if (isYfnEmail(user.email)) return true;
      const googleWorkspaceUserId =
        account?.provider === "google" ? account.providerAccountId : undefined;
      return isLinkedWorkspaceUser(googleWorkspaceUserId);
    },
    async jwt({ token, user, account }) {
      const email = user?.email ?? (token.email as string | undefined);
      if (email) {
        const googlePhotoIsDefault =
          account?.provider === "google"
            ? await getGooglePhotoIsDefault(account.access_token)
            : undefined;
        const appUser = await ensureAppUser({
          email,
          googleWorkspaceUserId:
            account?.provider === "google"
              ? account.providerAccountId
              : undefined,
          name: user?.name ?? (token.name as string | undefined),
          image: user?.image ?? undefined,
          firstName: user?.firstName,
          lastName: user?.lastName,
          googlePhotoIsDefault,
        });
        token.userId = appUser._id;
        token.organizationId = appUser.organizationId;
        token.role = appUser.role;
        token.teamId = appUser.teamId;
        token.secondaryTeamId = appUser.secondaryTeamId;
        token.email = appUser.email;
        token.profileImageStorageKey = appUser.profileImageStorageKey;
        token.publicProfileCompletedAt = appUser.publicProfileCompletedAt;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string | undefined) ?? "";
        session.user.organizationId = token.organizationId as
          | string
          | undefined;
        session.user.role = normalizeOptionalUserRole(token.role);
        session.user.teamId = token.teamId as string | undefined;
        session.user.secondaryTeamId = token.secondaryTeamId as
          | string
          | undefined;
        session.user.profileImageStorageKey = token.profileImageStorageKey as
          | string
          | undefined;
        session.user.publicProfileCompletedAt =
          token.publicProfileCompletedAt as number | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
