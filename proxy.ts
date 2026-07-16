import { auth } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login",
  "/invite",
  "/erstattung",
  "/ehrenamtspauschale",
  "/sign",
  "/withdraw-application",
  "/impressum",
  "/datenschutz",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!req.auth && !isPublicPath(pathname)) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
