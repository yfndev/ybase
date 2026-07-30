import type { TallyTemplateOption } from "@/lib/tally/types";

export async function fetchTallyTemplates(): Promise<TallyTemplateOption[]> {
  const response = await fetch("/api/tally/templates");
  if (!response.ok) {
    throw new Error(
      `Tally-Vorlagen konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as TallyTemplateOption[];
}
