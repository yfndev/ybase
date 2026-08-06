const PROSE_CLASSES =
  "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold";

export function DocumentContent({ html }: { html: string }) {
  return (
    <section
      className={`mt-6 max-h-[26rem] overflow-y-auto rounded-xl border bg-card p-6 text-sm leading-6 ${PROSE_CLASSES}`}
      aria-label="Dokumententext"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: text is sanitized server-side and hash-verified before delivery
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
