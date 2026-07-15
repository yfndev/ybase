import type { ApplicationField } from "@/lib/db/types";
import { formatFieldValue } from "./applicationPresentation";

export function ApplicationAnswers({
  title,
  fields,
}: {
  title: string;
  fields: ApplicationField[];
}) {
  if (fields.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <dl className="space-y-3 rounded-lg border p-4">
        {fields.map((field) => (
          <div key={field.key}>
            <dt className="text-xs font-medium text-muted-foreground">
              {field.label || "Antwort"}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">
              {formatFieldValue(field.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
