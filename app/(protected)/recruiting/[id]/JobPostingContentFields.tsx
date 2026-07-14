"use client";

import { RichTextEditor } from "@/components/Editor/RichTextEditor";
import { Label } from "@/components/ui/label";
import type { JobPostingFormValues } from "@/lib/jobPostings/form";

interface Props {
  values: JobPostingFormValues;
  onChange: (patch: Partial<JobPostingFormValues>) => void;
}

export function JobPostingContentFields({ values, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Beschreibung</Label>
        <RichTextEditor
          ariaLabel="Beschreibung"
          value={values.description}
          onChange={(description) => onChange({ description })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Aufgaben</Label>
        <RichTextEditor
          ariaLabel="Aufgaben"
          value={values.tasks}
          onChange={(tasks) => onChange({ tasks })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Anforderungen</Label>
        <RichTextEditor
          ariaLabel="Anforderungen"
          value={values.requirements}
          onChange={(requirements) => onChange({ requirements })}
        />
      </div>
    </div>
  );
}
