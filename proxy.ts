import { auth } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login",
  "/erstattung",
  "/ehrenamtspauschale",
  "/sign",
  "/withdraw-application",
  "/impressum",
  "/datenschutz",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!req.auth && !isPublic) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
