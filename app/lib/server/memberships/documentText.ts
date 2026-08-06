export type DocumentBlockStyle = "heading" | "subheading" | "body" | "listitem";

export interface DocumentBlock {
  style: DocumentBlockStyle;
  text: string;
}

const BLOCK_PATTERN = /<(h2|h3|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;

const BLOCK_STYLES: Record<string, DocumentBlockStyle> = {
  h2: "heading",
  h3: "subheading",
  p: "body",
  blockquote: "body",
  li: "listitem",
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const PDF_REPLACEMENTS: [RegExp, string][] = [
  [/[‘’‚‹›]/g, "'"],
  [/[“”„«»]/g, '"'],
  [/[–—−]/g, "-"],
  [/…/g, "..."],
  [/[   ]/g, " "],
];

const WIN_ANSI_EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

export function htmlToDocumentBlocks(html: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  for (const match of markListItems(html).matchAll(BLOCK_PATTERN)) {
    const text = toPlainText(match[2]);
    if (!text) continue;
    blocks.push({
      style: BLOCK_STYLES[match[1].toLowerCase()] ?? "body",
      text,
    });
  }
  return blocks;
}

export function toPdfText(text: string): string {
  const normalized = PDF_REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
  let output = "";
  for (const character of normalized) {
    if (isWinAnsiCharacter(character)) output += character;
  }
  return output;
}

function isWinAnsiCharacter(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  if (code >= 32 && code <= 126) return true;
  if (code >= 160 && code <= 255) return true;
  return WIN_ANSI_EXTRAS.includes(character);
}

function markListItems(html: string): string {
  const ordered = html.replace(
    /<ol\b[^>]*>([\s\S]*?)<\/ol>/gi,
    (_match, items: string) => {
      let index = 0;
      return items.replace(/<li\b[^>]*>/gi, () => `<li>${++index}. `);
    },
  );
  return ordered.replace(
    /<ul\b[^>]*>([\s\S]*?)<\/ul>/gi,
    (_match, items: string) => items.replace(/<li\b[^>]*>/gi, "<li>• "),
  );
}

function toPlainText(html: string): string {
  const withoutTags = html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string): string {
  return text.replace(
    /&(#\d+|#x[0-9a-f]+|[a-z]+);/gi,
    (match, code: string) => {
      const lowered = code.toLowerCase();
      if (lowered.startsWith("#x")) {
        return codePointToString(Number.parseInt(lowered.slice(2), 16), match);
      }
      if (lowered.startsWith("#")) {
        return codePointToString(Number(lowered.slice(1)), match);
      }
      return ENTITIES[lowered] ?? match;
    },
  );
}

function codePointToString(code: number, fallback: string): string {
  if (!Number.isInteger(code) || code < 1 || code > 0x10ffff) return fallback;
  return String.fromCodePoint(code);
}
