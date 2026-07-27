"use client";

import { ApplicationsPanel } from "@/components/Applications/ApplicationsPanel";
import type { JobPosting } from "@/lib/db/types";

export function JobPostingApplications({ posting }: { posting: JobPosting }) {
  return (
    <section className="space-y-4 rounded-lg border-2 p-4">
      <h2 className="font-medium">Bewerbungen</h2>
      <ApplicationsPanel jobPostingId={posting._id} />
    </section>
  );
}
