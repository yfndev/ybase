import type { ApplicationField } from "@/lib/db/types";
import { formatFieldLabel, formatFieldValue } from "./applicationPresentation";

function fieldHref(field: ApplicationField): string | undefined {
  if (typeof field.value !== "string" || field.value.length === 0) {
    return undefined;
  }

  const type = field.type.toUpperCase();
  if (type.includes("EMAIL")) return `mailto:${field.value}`;
  if (type.includes("PHONE")) return `tel:${field.value.replace(/\s/g, "")}`;
  if (
    type === "INPUT_LINK" ||
    (type === "PAYMENT" && /\b(link|url)\b/i.test(field.label))
  ) {
    return /^https?:\/\//i.test(field.value)
      ? field.value
      : `https://${field.value}`;
  }
  return undefined;
}

function ApplicationAnswer({ field }: { field: ApplicationField }) {
  const href = fieldHref(field);
  const value = formatFieldValue(field.value, field.type);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <dt className="text-sm leading-5 font-medium text-muted-foreground">
        {formatFieldLabel(field.label) || "Antwort"}
      </dt>
      <dd className="mt-1.5 max-w-[72ch] whitespace-pre-wrap break-words text-base leading-7">
        {href ? (
          <a
            className="underline-offset-4 hover:underline"
            href={href}
            rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
            target={href.startsWith("http") ? "_blank" : undefined}
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function ApplicationAnswers({
  title,
  fields,
}: {
  title: string;
  fields: ApplicationField[];
}) {
  if (fields.length === 0) return null;

  return (
    <section className="space-y-5 border-t pt-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      <dl className="divide-y">
        {fields.map((field) => (
          <ApplicationAnswer key={field.key} field={field} />
        ))}
      </dl>
    </section>
  );
}
