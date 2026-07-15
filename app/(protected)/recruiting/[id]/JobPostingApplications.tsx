"use client";

import { ApplicationsPanel } from "@/components/Applications/ApplicationsPanel";
import type { JobPosting } from "@/lib/db/types";

export function JobPostingApplications({ posting }: { posting: JobPosting }) {
  return (
    <section className="space-y-4 rounded-lg border-2 p-4">
      <div>
        <h2 className="font-medium">Bewerbungen</h2>
        <p className="text-sm text-muted-foreground">
          Bewerbungen für diese Ausschreibung prüfen und bearbeiten.
        </p>
      </div>
      <ApplicationsPanel jobPostingId={posting._id} />
    </section>
  );
}
