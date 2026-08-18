import { getRecruitingTallyTemplates } from "@/lib/server/jobPostings/tallyTemplates";

export async function GET() {
  try {
    return Response.json({ data: await getRecruitingTallyTemplates() });
  } catch (error) {
    console.error("Tally templates could not be loaded", error);
    return Response.json(
      { error: "Tally-Vorlagen konnten nicht geladen werden" },
      { status: 503 },
    );
  }
}
