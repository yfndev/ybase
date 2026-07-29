"use client";

import { RichTextEditor } from "@/components/Editor/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobPostingFormValues } from "@/lib/jobPostings/form";

interface Props {
  values: JobPostingFormValues;
  onChange: (patch: Partial<JobPostingFormValues>) => void;
}

const APPLICATION_QUESTION_FIELDS = [
  { id: "first", index: 0 },
  { id: "second", index: 1 },
  { id: "third", index: 2 },
] as const;

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
      <div className="flex flex-col gap-2">
        <Label>Benefits</Label>
        <RichTextEditor
          ariaLabel="Benefits"
          value={values.benefits}
          onChange={(benefits) => onChange({ benefits })}
        />
      </div>

      <section className="space-y-4 border-t pt-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Bewerbungsfragen</h2>
          <p className="text-sm text-muted-foreground">
            Diese Fragen werden direkt in das Tally-Formular übernommen.
          </p>
        </div>
        {APPLICATION_QUESTION_FIELDS.map(({ id, index }) => (
          <div className="flex flex-col gap-2" key={id}>
            <Label htmlFor={`jp-application-question-${index}`}>
              Frage {index + 1}
            </Label>
            <Textarea
              id={`jp-application-question-${index}`}
              value={values.applicationQuestions[index]}
              rows={2}
              onChange={(event) => {
                const applicationQuestions = [...values.applicationQuestions];
                applicationQuestions[index] = event.target.value;
                onChange({ applicationQuestions });
              }}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
