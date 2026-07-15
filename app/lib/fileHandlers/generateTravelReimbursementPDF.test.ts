import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { afterEach, expect, test, vi } from "vitest";
import { generateTravelReimbursementPDF } from "./generateTravelReimbursementPDF";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("creates the two-page travel form and appends every receipt page", async () => {
  const template = await readFile(
    "public/forms/reisekostenabrechnung-yfn-v5.pdf",
  );
  const signature = await readFile("public/yfn-logo.png");
  const receiptDocument = await PDFDocument.create();
  receiptDocument.addPage().drawText("Receipt page 1");
  receiptDocument.addPage().drawText("Receipt page 2");
  const receipt = await receiptDocument.save();

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "/forms/reisekostenabrechnung-yfn-v5.pdf") {
        return new Response(new Uint8Array(template).buffer, { status: 200 });
      }
      if (url === "https://example.test/receipt.pdf") {
        return new Response(new Uint8Array(receipt).buffer, { status: 200 });
      }
      if (url === "https://example.test/signature.png") {
        return new Response(new Uint8Array(signature).buffer, { status: 200 });
      }
      return new Response(null, { status: 404 });
    }),
  );

  const blob = await generateTravelReimbursementPDF(
    {
      type: "travel",
      accountHolder: "Max Mustermann",
      submitterName: "Max Mustermann",
      amount: 50,
      iban: "DE89370400440532013000",
      projectName: "Allgemein",
      signatureUrl: "https://example.test/signature.png",
      travelDetails: {
        startDate: "2026-05-15",
        endDate: "2026-05-20",
        destination: "Berlin",
        purpose: "Event",
        isInternational: false,
      },
    },
    [
      {
        receiptNumber: "RK-1",
        companyName: "Deutsche Bahn",
        costType: "train",
        grossAmount: 50,
        fileUrl: "https://example.test/receipt.pdf",
      },
    ],
  );
  const generated = await PDFDocument.load(await blob.arrayBuffer());
  expect(blob.type).toBe("application/pdf");
  expect(generated.getPageCount()).toBe(4);
  expect(generated.getTitle()).toBe("Reisekostenerstattung Max Mustermann");
});
