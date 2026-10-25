import { defineEventHandler, getQuery, setHeader, createError } from "h3";
import { getSession } from "@agent-native/core/server";
import { getOrgContext } from "@agent-native/core/org";
import { getDeck } from "../../lib/decks";
import { renderProof } from "../../lib/layout";
export default defineEventHandler(async event => {
  const query = getQuery(event); const id = String(query.id ?? ""), revision = Number(query.revision);
  const session = await getSession(event); const userEmail = session?.email; const { orgId } = await getOrgContext(event); if (!userEmail) throw createError({ statusCode: 401, message: "Sign in to download proofs." });
  const deck = await getDeck(id, { caller: "http", userEmail, orgId });
  if (deck.revision !== revision || deck.approvedRevision !== revision) throw createError({ statusCode: 409, message: "Review and approve this exact revision before export." });
  const result = await renderProof(deck.content, true);
  if (!result.pdf || result.findings.length) throw createError({ statusCode: 409, message: "The deck has unresolved mechanical findings." });
  setHeader(event, "Content-Type", "application/pdf"); setHeader(event, "Content-Disposition", `attachment; filename="proofdeck-r${revision}.pdf"`); setHeader(event, "Cache-Control", "private, no-store");
  return result.pdf;
});
