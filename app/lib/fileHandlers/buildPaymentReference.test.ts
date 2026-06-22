import { describe, expect, it } from "vitest";
import { buildPaymentReference } from "./buildPaymentReference";
import { shortReferenceId } from "./referenceId";

const ID = "reimbursement_abcd1234efgh5678";

describe("buildPaymentReference", () => {
  it("includes reference, project and name", () => {
    const result = buildPaymentReference({
      reimbursementId: ID,
      projectName: "Hackathon 2026",
      name: "Max Mustermann",
    });
    expect(result).toBe(
      `Erstattung ${shortReferenceId(ID)} Hackathon 2026 Max Mustermann`,
    );
  });

  it("transliterates German umlauts", () => {
    const result = buildPaymentReference({
      reimbursementId: ID,
      projectName: "Köln Müller-Straße",
      name: "Weiß",
    });
    expect(result).toContain("Koeln Mueller-Strasse");
    expect(result).toContain("Weiss");
  });

  it("removes characters Finom does not allow", () => {
    const result = buildPaymentReference({
      reimbursementId: ID,
      projectName: "Mauz & Co #1",
      name: "A*B",
    });
    expect(result).not.toMatch(/[&#*]/);
  });

  it("never exceeds 100 characters and has no trailing slash or space", () => {
    const result = buildPaymentReference({
      reimbursementId: ID,
      projectName: "Projekt ".repeat(30),
      name: "Sehr Langer Name",
    });
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).not.toMatch(/[\s/]$/);
  });

  it("works without project or name", () => {
    const result = buildPaymentReference({ reimbursementId: ID });
    expect(result).toBe(`Erstattung ${shortReferenceId(ID)}`);
  });
});
