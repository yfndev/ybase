import type { ApplicationWithFiles } from "@/lib/db/types";

export async function fetchApplication(
  applicationId: string,
): Promise<ApplicationWithFiles> {
  const response = await fetch(`/api/applications/${applicationId}`);

  if (!response.ok) {
    throw new Error(
      `Bewerbung konnte nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as ApplicationWithFiles;
}
