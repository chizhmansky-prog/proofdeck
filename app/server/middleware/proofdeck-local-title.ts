import { defineEventHandler, readBody, getRequestURL, createError } from "h3";
import { getSession } from "@agent-native/core/server";
import { z } from "zod";

// The custom subscription runtime has no API-backed title generator. Use an
// honest deterministic title for that runtime; keep other provider routes intact.
export default defineEventHandler(async event => {
  if (event.req.method !== "POST" || getRequestURL(event).pathname !== "/_agent-native/agent-chat/generate-title") return;
  const body: unknown = await readBody(event);
  const parsed = z.object({ engine: z.literal("codex-cli"), message: z.string().max(20000) }).safeParse(body);
  if (!parsed.success) return;
  if (!(await getSession(event))?.email) throw createError({ statusCode: 401 });
  return { title: parsed.data.message.split("\n")[0].slice(0, 72), titleSource: "fallback" };
});
