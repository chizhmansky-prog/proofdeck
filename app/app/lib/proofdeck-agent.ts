import { createHttpAgentChatRuntime } from "@agent-native/core/client/agent-chat";
import { TAB_ID } from "./tab-id";
export const proofdeckRuntime = createHttpAgentChatRuntime({
  id: "proofdeck:codex-local", label: "ProofDeck editor", endpoint: "/api/proofdeck-agent",
  headers: () => ({ "X-Agent-Native-Browser-Tab": TAB_ID }),
  mapEvent: (event) => {
    const value = event as import("@agent-native/core/client/agent-chat").AgentChatRuntimeEvent;
    if (value.type === "usage") return null; // Core 0.220 emits undefined currency/cost fields for subscription usage.
    if (value.type === "tool-done" || value.type === "done") window.dispatchEvent(new Event("proofdeck:agent-write"));
    return value;
  },
  mapRequest: ({ turn }) => {
    const params = new URLSearchParams(window.location.search);
    return { id: params.get("id"), cardId: params.get("card") ?? undefined, prompt: turn.prompt ?? "Review and improve the selected wording without changing the rules." };
  },
});
