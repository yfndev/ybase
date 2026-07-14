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
        { key: "q5", label: "Skills", type: "CHECKBOXES", value: ["a", "b"] },
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

test("derives name from first and last name fields and reads phone", () => {
  const parsed = parseTallySubmission(payload());
  expect(parsed.name).toBe("Max Mustermann");
  expect(parsed.phone).toBe("+491234");
});

test("snapshot keeps typed answers but drops the hidden field", () => {
  const parsed = parseTallySubmission(payload());
  expect(parsed.fields).toHaveLength(5);
  expect(parsed.fields.some((field) => field.label === "jobPostingId")).toBe(
    false,
  );
  const skills = parsed.fields.find((field) => field.key === "q5");
  expect(skills?.value).toEqual(["a", "b"]);
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
});
