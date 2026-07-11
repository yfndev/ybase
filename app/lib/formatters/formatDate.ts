export function formatDate(
  date: Date | string | number | null | undefined,
): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
