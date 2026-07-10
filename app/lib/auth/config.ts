import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { ensureAppUser } from "./provisioning";
import { normalizeOptionalUserRole } from "./roles";

const ALLOWED_EMAIL_DOMAIN = "youngfounders.network";

function isAllowedEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`));
}

const allowTestLogin =
  process.env.IS_TEST === "true" && process.env.NODE_ENV !== "production";

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
        profile.family_name ?? profile.name?.split(" ").slice(1).join(" ") ?? "",
    };
  },
});

const testing = Credentials({
  id: "testing",
  name: "Testing",
  credentials: { email: {}, name: {} },
  authorize(credentials) {
    if (!allowTestLogin) return null;
    const email = credentials?.email as string | undefined;
    if (!email) return null;
    return {
      id: email,
      email,
      name: (credentials?.name as string) ?? "Test User",
    };
  },
});

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: allowTestLogin ? [google, testing] : [google],
  callbacks: {
    signIn({ user }) {
      if (allowTestLogin) return true;
      return isAllowedEmail(user.email);
    },
    async jwt({ token, user, trigger }) {
      const email = user?.email ?? (token.email as string | undefined);
      if (email && (user || trigger === "update")) {
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
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.role = normalizeOptionalUserRole(token.role);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
