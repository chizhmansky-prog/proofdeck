import { z } from "zod";
export const cardSchema = z.object({
  id: z.string().regex(/^[\p{L}\p{N}_-]{1,64}$/u).describe("Stable CSV card ID"),
  name: z.string().trim().min(1).max(70).describe("Card title"),
  source: z.string().trim().min(1).max(8000).describe("Original English rules text"),
  text: z.string().max(8000).describe("Current localized wording"),
});
export type Card = z.infer<typeof cardSchema>;
export type Proposal = { id: string; cardId: string; before: string; text: string; reason: string; origin: "agent" | "editor"; createdAt: string };
export type Term = { source: string; target: string };
export type DeckContent = { language: string; cards: Card[]; glossary: Term[]; proposals: Proposal[] };
export type Deck = { id: string; name: string; revision: number; approvedRevision: number | null; content: DeckContent; updatedAt: string };
export type Finding = { cardId: string; kind: "number" | "symbol" | "glossary" | "layout"; message: string };
const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort().join("|");
const symbols = (s: string) => (s.match(/\{[A-Z][A-Z0-9_]*\}/g) ?? []).sort().join("|");
export function checkCopy(card: Card, glossary: Term[]): Finding[] {
  const out: Finding[] = [];
  if (numbers(card.source) !== numbers(card.text)) out.push({ cardId: card.id, kind: "number", message: "Printed numbers differ from the source." });
  if (symbols(card.source) !== symbols(card.text)) out.push({ cardId: card.id, kind: "symbol", message: "Game-symbol tokens differ from the source." });
  for (const term of glossary) {
    const words = card.source.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    const applies = words.some(w => w === term.source.toLocaleLowerCase() || w === term.source.toLocaleLowerCase() + "s");
    if (applies && !card.text.toLocaleLowerCase().includes(term.target.toLocaleLowerCase())) out.push({ cardId: card.id, kind: "glossary", message: `Glossary: ${term.source} → ${term.target}` });
  }
  return out;
}

export function parseCsv(input: string): Card[] {
  if (new TextEncoder().encode(input).byteLength > 1_000_000) throw new Error("CSV must be smaller than 1 MB.");
  const rows: string[][] = []; let row: string[] = [], value = "", quoted = false, closed = false;
  const text = input.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; } } else value += c; }
    else if (c === '"' && value === "" && !closed) quoted = true;
    else if (c === ",") { row.push(value); value = ""; closed = false; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(value); if (row.some(x => x !== "")) rows.push(row); row = []; value = ""; closed = false; }
    else { if (closed || c === '"') throw new Error("Malformed CSV quoting."); value += c; }
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(value); if (row.some(x => x !== "")) rows.push(row);
  const header = rows.shift()?.map(x => x.trim().toLowerCase());
  if (!header || new Set(header).size !== header.length || !["id", "name", "source", "text"].every(x => header.includes(x))) throw new Error("Required CSV columns: id,name,source,text (unique headers).");
  if (rows.length < 1 || rows.length > 100) throw new Error("Import between 1 and 100 cards.");
  const cards = rows.map((r, i) => {
    if (r.length !== header.length) throw new Error(`Row ${i + 2}: column count differs from header.`);
    const parsed = cardSchema.safeParse(Object.fromEntries(header.map((h, j) => [h, r[j]])));
    if (!parsed.success) throw new Error(`Row ${i + 2}: ${parsed.error.issues.map(x => x.path.join(".") + " " + x.message).join("; ")}`);
    return parsed.data;
  });
  if (new Set(cards.map(c => c.id)).size !== cards.length) throw new Error("Card IDs must be unique. No cards were imported.");
  return cards;
}
