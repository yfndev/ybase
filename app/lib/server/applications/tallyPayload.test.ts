import { expect, test } from "vitest";
import { parseTallySubmission, tallyWebhookSchema } from "./tallyPayload";

function payload() {
  return tallyWebhookSchema.parse({
    eventId: "evt-1",
    eventType: "FORM_RESPONSE",
    createdAt: "2026-07-14T10:00:00.000Z",
    data: {
      responseId: "res-1",
      submissionId: "sub-1",
      formId: "form-1",
      createdAt: "2026-07-14T10:00:00.000Z",
      fields: [
        {
          key: "hf",
          label: "jobPostingId",
          type: "HIDDEN_FIELDS",
          value: "jp-1",
        },
        { key: "q1", label: "Vorname", type: "INPUT_TEXT", value: "Max" },
        {
          key: "q2",
          label: "Nachname",
          type: "INPUT_TEXT",
          value: "Mustermann",
        },
        {
          key: "q3",
          label: "E-Mail-Adresse",
          type: "INPUT_EMAIL",
          value: "  MAX@Example.COM ",
        },
        {
          key: "q4",
          label: "Telefon",
          type: "INPUT_PHONE_NUMBER",
          value: "+491234",
        },
        {
          key: "q5",
          label: "Wie viele Stunden kannst du pro Woche investieren?",
          type: "CHECKBOXES",
          value: ["44dd9142-3ba6-470f-b69a-6ba1b9bf5234", "b"],
          options: [
            {
              id: "44dd9142-3ba6-470f-b69a-6ba1b9bf5234",
              text: "Zwischen 4 und 8 Stunden",
            },
            { id: "b", text: "Kommunikation" },
          ],
        },
        {
          key: "q5_44dd9142-3ba6-470f-b69a-6ba1b9bf5234",
          label:
            "Wie viele Stunden kannst du pro Woche investieren? (Zwischen 4 und 8 Stunden)",
          type: "CHECKBOXES",
          value: true,
        },
        {
          key: "q5_b",
          label: "Skills (Kommunikation)",
          type: "CHECKBOXES",
          value: true,
        },
        {
          key: "q6",
          label: "Verfügbarkeit",
          type: "MATRIX",
          value: { monday: ["morning", "evening"] },
          rows: [{ id: "monday", text: "Montag" }],
          columns: [
            { id: "morning", text: "Morgens" },
            { id: "evening", text: "Abends" },
          ],
        },
        {
          key: "q7",
          label: "Lebenslauf",
          type: "FILE_UPLOAD",
          value: [
            {
              id: "file-1",
              name: "cv.pdf",
              url: "https://storage.tally.so/private/cv.pdf?token=secret",
              mimeType: "application/pdf",
              size: 1234,
            },
          ],
        },
        {
          key: "q8",
          label: "Prioritäten",
          type: "RANKING",
          value: ["impact", "learning"],
          options: [
            { id: "learning", text: "Lernen" },
            { id: "impact", text: "Wirkung" },
          ],
        },
        {
          key: "q9",
          label: "Einwilligung",
          type: "CHECKBOXES",
          value: true,
        },
        {
          key: "q10",
          label: "Unterschrift",
          type: "SIGNATURE",
          value: [
            {
              id: "signature-1",
              name: "private-signature.png",
              url: "https://storage.tally.so/private/signature.png?token=secret",
              mimeType: "image/png",
              size: 400,
            },
          ],
        },
      ],
    },
  });
}

test("extracts the hidden job posting id", () => {
  expect(parseTallySubmission(payload()).jobPostingId).toBe("jp-1");
});

test("normalizes the applicant email", () => {
  const parsed = parseTallySubmission(payload());
  expect(parsed.email).toBe("MAX@Example.COM");
  expect(parsed.emailNormalized).toBe("max@example.com");
});

test("extracts the required applicant phone number", () => {
  expect(parseTallySubmission(payload()).phone).toBe("+491234");
});

test("derives name from first and last name fields", () => {
  const parsed = parseTallySubmission(payload());
  expect(parsed.name).toBe("Max Mustermann");
});

test("normalizes every structured field and drops only hidden metadata", () => {
  const parsed = parseTallySubmission(payload());
  expect(parsed.fields).toHaveLength(10);
  expect(parsed.fields.some((field) => field.label === "jobPostingId")).toBe(
    false,
  );
  expect(parsed.fields.find((field) => field.key === "q4")?.value).toBe(
    "+491234",
  );
  const skills = parsed.fields.find((field) => field.key === "q5");
  expect(skills?.value).toEqual(["Zwischen 4 und 8 Stunden", "Kommunikation"]);
  expect(
    parsed.fields.some(
      (field) => field.key === "q5_44dd9142-3ba6-470f-b69a-6ba1b9bf5234",
    ),
  ).toBe(false);
  expect(parsed.fields.some((field) => field.key === "q5_b")).toBe(false);
  expect(parsed.fields.find((field) => field.key === "q6")?.value).toEqual({
    Montag: ["Morgens", "Abends"],
  });
  expect(parsed.fields.find((field) => field.key === "q7")?.value).toEqual([
    "cv.pdf",
  ]);
  expect(parsed.fields.find((field) => field.key === "q8")?.value).toEqual([
    "Wirkung",
    "Lernen",
  ]);
  expect(parsed.fields.find((field) => field.key === "q9")?.value).toBe(true);
  expect(parsed.fields.find((field) => field.key === "q10")?.value).toBe(
    "Vorhanden",
  );
  expect(JSON.stringify(parsed.fields)).not.toContain("token=secret");
  expect(JSON.stringify(parsed.fields)).not.toContain("private-signature.png");
});

test("extracts file metadata separately from the answer snapshot", () => {
  expect(parseTallySubmission(payload()).files).toEqual([
    {
      fieldKey: "q7",
      fieldLabel: "Lebenslauf",
      sourceId: "file-1",
      sourceUrl: "https://storage.tally.so/private/cv.pdf?token=secret",
      fileName: "cv.pdf",
      mimeType: "application/pdf",
      size: 1234,
    },
  ]);
});

test("returns null identity when the hidden field or email is absent", () => {
  const parsed = parseTallySubmission(
    tallyWebhookSchema.parse({
      eventId: "evt-2",
      eventType: "FORM_RESPONSE",
      data: {
        responseId: "res-2",
        submissionId: "sub-2",
        formId: "form-1",
        fields: [
          { key: "q1", label: "Motivation", type: "TEXTAREA", value: "x" },
        ],
      },
    }),
  );
  expect(parsed.jobPostingId).toBeNull();
  expect(parsed.email).toBeNull();
  expect(parsed.emailNormalized).toBeNull();
  expect(parsed.phone).toBeNull();
});

test.each(["MULTIPLE_CHOICE", "DROPDOWN", "MULTI_SELECT"])(
  "resolves option labels for %s",
  (type) => {
    const parsed = parseTallySubmission(
      tallyWebhookSchema.parse({
        eventId: `evt-${type}`,
        eventType: "FORM_RESPONSE",
        data: {
          responseId: `res-${type}`,
          submissionId: `sub-${type}`,
          formId: "form-1",
          fields: [
            {
              key: "choice",
              label: "Auswahl",
              type,
              value: ["option-2", "option-1"],
              options: [
                { id: "option-1", text: "Erste Option" },
                { id: "option-2", text: "Zweite Option" },
              ],
            },
          ],
        },
      }),
    );

    expect(parsed.fields[0]?.value).toEqual(["Zweite Option", "Erste Option"]);
  },
);

test.each([
  ["CALCULATED_FIELDS", 20],
  ["INPUT_TEXT", "Kurze Antwort"],
  ["INPUT_NUMBER", 10],
  ["INPUT_EMAIL", "max@example.com"],
  ["INPUT_PHONE_NUMBER", "+491234"],
  ["INPUT_LINK", "https://example.com"],
  ["INPUT_DATE", "2026-07-26"],
  ["INPUT_TIME", "12:30"],
  ["TEXTAREA", "Lange Antwort"],
  ["PAYMENT", "EUR"],
  ["RATING", 4],
  ["LINEAR_SCALE", 7],
  ["CSAT", 5],
  ["NPS", 9],
] as const)("keeps the typed value for %s", (type, value) => {
  const parsed = parseTallySubmission(
    tallyWebhookSchema.parse({
      eventId: `evt-${type}`,
      eventType: "FORM_RESPONSE",
      data: {
        responseId: `res-${type}`,
        submissionId: `sub-${type}`,
        formId: "form-1",
        fields: [{ key: "field", label: "Feld", type, value }],
      },
    }),
  );

  expect(parsed.fields[0]?.value).toBe(value);
});
