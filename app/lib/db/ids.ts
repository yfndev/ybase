export function newId(): string {
  return crypto.randomUUID();
}

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
