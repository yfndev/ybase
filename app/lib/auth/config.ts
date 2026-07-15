import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { isTestMode } from "./environment";
import { ensureAppUser } from "./provisioning";
import { normalizeOptionalUserRole } from "./roles";

const ALLOWED_EMAIL_DOMAIN = "youngfounders.network";

function isAllowedEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`));
}

const isTestLoginEnabled = isTestMode();

const google = Google({
  authorization: {
    params: { prompt: "select_account", hd: ALLOWED_EMAIL_DOMAIN },
  },
  profile(profile) {
    if (!isAllowedEmail(profile.email)) {
      throw new Error("Nur youngfounders.network-Konten sind zugelassen");
    }
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

const testProvider = Credentials({
  id: "testing",
  name: "Testing",
  credentials: { email: {}, name: {} },
  authorize(credentials) {
    if (!isTestLoginEnabled) return null;
    const email = (credentials?.email as string | undefined)
      ?.trim()
      .toLowerCase();
    if (!email) return null;
    return {
      id: email,
      email,
      name:
        (credentials?.name as string | undefined)?.trim() || "Test User",
    };
  },
});

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: isTestLoginEnabled ? [testProvider] : [google],
  callbacks: {
    signIn({ user }) {
      if (isTestLoginEnabled) return true;
      return isAllowedEmail(user.email);
    },
    async jwt({ token, user }) {
      const email = user?.email ?? (token.email as string | undefined);
      if (email) {
        const appUser = await ensureAppUser({
          email,
          name: user?.name ?? (token.name as string | undefined),
          image: user?.image ?? undefined,
          firstName: user?.firstName,
          lastName: user?.lastName,
        });
        token.userId = appUser._id;
        token.organizationId = appUser.organizationId;
        token.role = appUser.role;
        token.email = appUser.email;
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
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
