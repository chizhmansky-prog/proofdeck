import { fail, type ActionRunContext } from "@agent-native/core/action";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { DeckContent } from "../../shared/deck";
export function owner(ctx?: ActionRunContext) { return ctx?.userEmail ?? fail("Sign in to open your decks.", { statusCode: 401, errorCode: "sign_in_required" }); }
export function scope(ctx?: ActionRunContext) { return and(eq(schema.decks.ownerEmail, owner(ctx)), ctx?.orgId ? eq(schema.decks.orgId, ctx.orgId) : isNull(schema.decks.orgId)); }
export async function getDeck(id: string, ctx?: ActionRunContext) {
  const [deck] = await getDb().select().from(schema.decks).where(and(eq(schema.decks.id, id), scope(ctx))).limit(1);
  return deck ?? fail("Deck not found.", { statusCode: 404, errorCode: "not_found" });
}
export async function changeDeck(id: string, revision: number, ctx: ActionRunContext | undefined, summary: string, edit: (content: DeckContent) => void) {
  return getDb().transaction(async tx => {
    const [deck] = await tx.select().from(schema.decks).where(and(eq(schema.decks.id, id), scope(ctx))).for("update").limit(1);
    if (!deck) fail("Deck not found.", { statusCode: 404, errorCode: "not_found" });
    if (deck.revision !== revision) fail("This deck changed. Refresh before saving; your edit has not overwritten anything.", { statusCode: 409, errorCode: "stale_revision" });
    const content = structuredClone(deck.content); edit(content);
    const now = new Date().toISOString(); const next = revision + 1;
    await tx.update(schema.decks).set({ content, revision: next, approvedRevision: null, updatedAt: now }).where(eq(schema.decks.id, id));
    await tx.insert(schema.revisions).values({ id: crypto.randomUUID(), deckId: id, ownerEmail: owner(ctx), orgId: deck.orgId, revision: next, summary, content, createdAt: now });
    return { id, revision: next };
  });
}
