import type { User } from "@/lib/db/types";

export async function fetchMembers(): Promise<User[]> {
  const response = await fetch("/api/members");

  if (!response.ok) {
    throw new Error(
      `Mitglieder konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as User[];
}
