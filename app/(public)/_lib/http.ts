export const CONNECTION_ERROR =
  "Verbindung fehlgeschlagen. Bitte versuche es später erneut.";

export async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Fehler");
  return data;
}

export async function uploadViaPresign(
  url: string,
  body: { contentType: string },
  file: Blob,
): Promise<string> {
  const { key, url: putUrl } = await postJson(url, body);
  const result = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": body.contentType },
    body: file,
  });
  if (!result.ok) throw new Error("Upload fehlgeschlagen");
  return key;
}
