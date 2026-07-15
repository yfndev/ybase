function responseErrorDetail(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;

  for (const key of ["message", "error", "detail"]) {
    const detail = responseErrorDetail((value as Record<string, unknown>)[key]);
    if (detail) return detail;
  }
}

export async function tallyApiError(response: Response): Promise<Error> {
  const body = await response.text();
  let detail: string | undefined;
  try {
    detail = responseErrorDetail(JSON.parse(body));
  } catch {
    detail = undefined;
  }
  const suffix = detail?.trim().replaceAll(/\s+/g, " ").slice(0, 300);
  return new Error(
    `Tally API request failed (${response.status})${suffix ? `: ${suffix}` : ""}`,
  );
}
