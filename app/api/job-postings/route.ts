import { getJobPostings } from "@/lib/server/jobPostings/data";

export async function GET() {
  try {
    const data = await getJobPostings();
    return Response.json({ data });
  } catch {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
}
