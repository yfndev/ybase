export function normalizeYfnEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailDomain(email: string): string | undefined {
  return normalizeYfnEmail(email).split("@")[1];
}
