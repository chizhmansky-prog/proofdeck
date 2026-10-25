import { defineEventHandler, readBody, createError, createEventStream, getHeader } from "h3";
import { getSession } from "@agent-native/core/server";
import { getOrgContext } from "@agent-native/core/org";
import { z } from "zod";
import { runProofdeckAgent } from "../../agent/proofdeck-runtime";
const active = new Set<string>();
const inputSchema = z.object({ id: z.string().uuid(), cardId: z.string().optional(), prompt: z.string().min(1).max(5000) });
export default defineEventHandler(async event => {
  const session = await getSession(event); const userEmail = session?.email; const { orgId } = await getOrgContext(event); if (!userEmail) throw createError({ statusCode: 401, message: "Sign in before asking the agent." });
  const origin = getHeader(event, "origin"); if (origin && new URL(origin).origin !== new URL(event.req.url).origin) throw createError({ statusCode: 403, message: "Origin mismatch." });
  if (process.env.NODE_ENV === "production") throw createError({ statusCode: 503, message: "The local Codex bridge is disabled on hosted production. Run locally or configure a dedicated isolated host." });
  const input = inputSchema.parse(await readBody(event));
  const key = `${userEmail}:${input.id}`; if (active.has(key)) throw createError({ statusCode: 409, message: "An agent is already working on this deck. Stop or finish that run first." });
  active.add(key); const stream = createEventStream(event); const controller = new AbortController();
  stream.onClosed(() => controller.abort());
  const ctx = { caller: "tool" as const, userEmail, orgId, signal: controller.signal };
  const send = async (value: unknown) => { await stream.push({ data: JSON.stringify(value) }); };
  void (async () => {
    try { await runProofdeckAgent({ ...input, signal: controller.signal }, ctx, send); await send({ type: "done", reason: "complete" }); }
    catch (e) { await send({ type: "error", error: controller.signal.aborted ? "Agent stopped. Saved proposals, if any, remain available." : e instanceof Error ? e.message : "Agent failed.", retryable: false }); await send({ type: "done", reason: controller.signal.aborted ? "cancelled" : "error" }); }
    finally { active.delete(key); await stream.close(); }
  })();
  return stream.send();
});
