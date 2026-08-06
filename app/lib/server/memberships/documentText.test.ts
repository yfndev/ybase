import { expect, test } from "vitest";
import { htmlToDocumentBlocks, toPdfText } from "./documentText";

test("maps headings, paragraphs and list markers to ordered blocks", () => {
  const blocks = htmlToDocumentBlocks(
    "<h2>§ 1 Zweck</h2><h3>Absatz</h3><p>Erster Satz.</p>" +
      "<ol><li>Nutzungsrecht</li><li>Urheberrecht</li></ol>" +
      "<ul><li>Software</li></ul>",
  );

  expect(blocks).toEqual([
    { style: "heading", text: "§ 1 Zweck" },
    { style: "subheading", text: "Absatz" },
    { style: "body", text: "Erster Satz." },
    { style: "listitem", text: "1. Nutzungsrecht" },
    { style: "listitem", text: "2. Urheberrecht" },
    { style: "listitem", text: "• Software" },
  ]);
});

test("decodes entities, drops inline markup and skips empty blocks", () => {
  const blocks = htmlToDocumentBlocks(
    "<p><strong>Rechte</strong> &amp; Pflichten&nbsp;&#8211; klar</p><p></p>",
  );

  expect(blocks).toEqual([
    { style: "body", text: "Rechte & Pflichten – klar" },
  ]);
});

test("keeps German characters and normalizes typography for the PDF font", () => {
  expect(toPdfText("Größe, Übung, Maß, § 5, 20 €")).toBe(
    "Größe, Übung, Maß, § 5, 20 €",
  );
  expect(toPdfText("„Arbeitsergebnis“ – so ’gilt‘ es…")).toBe(
    "\"Arbeitsergebnis\" - so 'gilt' es...",
  );
});

test("removes characters the PDF font cannot encode", () => {
  const unsupported = String.fromCodePoint(0x1f600) + String.fromCharCode(1);
  expect(toPdfText(`Vertrag ${unsupported} gültig`)).toBe("Vertrag  gültig");
});
