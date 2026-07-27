export function normalizeYfnEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailDomain(email: string): string | undefined {
  return normalizeYfnEmail(email).split("@")[1];
}

const GERMAN_CHARACTERS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

export function suggestYfnEmail(
  applicantName: string | undefined,
  domain: string,
): string {
  const nameParts = (applicantName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? (nameParts.at(-1) ?? "") : "";
  const localPart = [firstName, lastName]
    .filter(Boolean)
    .map(normalizeNamePart)
    .filter(Boolean)
    .join(".")
    .slice(0, 64)
    .replace(/\.+$/g, "");

  return localPart ? `${localPart}@${domain.trim().toLowerCase()}` : "";
}

function normalizeNamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[äöüß]/g, (character) => GERMAN_CHARACTERS[character])
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
