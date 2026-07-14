"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { DepartmentsSection } from "./DepartmentsSection";
import { TeamsSection } from "./TeamsSection";

export function TeamsClient() {
  return (
    <div className="space-y-10">
      <PageHeader title="Struktur" />
      <DepartmentsSection />
      <TeamsSection />
    </div>
  );
}
