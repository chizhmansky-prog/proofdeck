import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useActionQuery, useActionMutation, actionErrorMessage } from "@agent-native/core/client/hooks";
import { sendToAgentChatAndConfirm } from "@agent-native/core/client/agent-chat";
import { useQueryClient } from "@tanstack/react-query";
import { IconUpload, IconMessage, IconDownload, IconCheck, IconArrowRight, IconHistory } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cardCss, renderCard } from "../../shared/card-renderer";
import { checkCopy, type Card } from "../../shared/deck";
import "../styles/proofdeck.css";

export function meta() { return [{ title: "ProofDeck — words that make it to the table" }]; }
function PhysicalCard({ card, language, selected, onClick }: { card: Card; language: string; selected?: boolean; onClick?: () => void }) {
  return <button type="button" className={`pd-card-button ${selected ? "selected" : ""}`} aria-label={`Edit ${card.name}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: renderCard(card, language) }} />;
}
export default function DecksRoute() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id") ?? "", cardId = params.get("card");
  const projects = useActionQuery("list-decks", {});
  const deckQuery = useActionQuery("get-deck", { id }, { enabled: !!id });
  const deck = deckQuery.data;
  const checks = useActionQuery("inspect-layout", { id, variant: "current" }, { enabled: !!deck });
  const history = useActionQuery("deck-history", { id }, { enabled: !!deck });
  const [showImport, setShowImport] = useState(false), [showGlossary, setShowGlossary] = useState(false), [showHistory, setShowHistory] = useState(false);
  const [name, setName] = useState(""), [language, setLanguage] = useState("German"), [csv, setCsv] = useState("");
  const [wording, setWording] = useState(""), [reviewed, setReviewed] = useState(false), [glossary, setGlossary] = useState("");
  const [openingAgent, setOpeningAgent] = useState(false);
  const [preview, setPreview] = useState(true), [onlyFindings, setOnlyFindings] = useState(false);
  const queryClient = useQueryClient();
  const error = (e: unknown) => toast.error(actionErrorMessage(e) ?? "The operation failed. Please retry.");
  const importer = useActionMutation("import-deck", { onError: error, onSuccess: result => { setShowImport(false); setParams({ id: result.id }); setCsv(""); toast.success("Deck imported. Your source text stays intact."); } });
  const save = useActionMutation("update-deck", { onError: error, onSuccess: () => toast.success("Saved to this deck’s revision history.") });
  const review = useActionMutation("review-copy", { onError: error, onSuccess: () => { setPreview(false); toast.success("Review decision saved."); } });
  const approve = useActionMutation("approve-proof", { onError: error, onSuccess: () => toast.success("This revision is approved for an editorial proof.") });
  const card = deck?.content.cards.find(c => c.id === cardId) ?? deck?.content.cards[0];
  const proposal = deck?.content.proposals.find(p => p.cardId === card?.id);
  const dirty = !!card && wording !== card.text;
  const findings = checks.data?.findings ?? deck?.content.cards.flatMap(c => checkCopy(c, deck.content.glossary)) ?? [];
  const selectedFindings = findings.filter(f => f.cardId === card?.id);
  const approved = !!deck && deck.approvedRevision === deck.revision;
  useEffect(() => { setWording(card?.text ?? ""); setPreview(true); }, [card?.id, card?.text]);
  useEffect(() => { setReviewed(false); }, [deck?.revision]);
  useEffect(() => {
    const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["action"] }); };
    window.addEventListener("proofdeck:agent-write", refresh); return () => window.removeEventListener("proofdeck:agent-write", refresh);
  }, [queryClient]);
  async function ask(all = false) {
    if (!deck || !card) return;
    if (dirty) { toast.error("Save your wording before asking for a proposal."); return; }
    setParams(all ? { id: deck.id } : { id: deck.id, card: card.id });
    setOpeningAgent(true);
    const delivery = await sendToAgentChatAndConfirm({ message: all ? "Review every card in this deck. Fix numbers, symbols and glossary errors and overflowing wording. Save necessary proposals and inspect their rendered layout at fixed 10 pt. Preserve all original game rules." : "Review the selected card against its source. Fix numbers, symbols and glossary errors; shorten the translation to fit at 10 pt without losing game rules. Save a proposal and inspect its rendered layout.", context: JSON.stringify({ deckId: deck.id, cardId: card.id, revision: deck.revision }), submit: true, openSidebar: true, chatTarget: "local", newTab: true, reuseEmptyTab: true }, { timeoutMs: 15000 });
    setOpeningAgent(false);
    if (!delivery.delivered) toast.error(`Agent did not receive the request (${delivery.reason ?? "unknown"}). Open the agent panel and retry.`);
  }
  async function sample() {
    const quote = (s: string) => '"' + s.replace(/"/g, '""') + '"';
    const data: { id: string; name: string; source: string; draft: string }[] = (await import("../../shared/sample.json")).default;
    importer.mutate({ name: "The Amber Atlas", language: "German", csv: "id,name,source,text\n" + data.map(c => [c.id, c.name, c.source, c.draft].map(quote).join(",")).join("\n") });
  }
  return <div className="pd-workspace">
    <style>{cardCss}</style>
    <header className="pd-toolbar"><div className="pd-wordmark">ProofDeck<span>WORDS THAT MAKE IT TO THE TABLE</span></div><div className="pd-toolbar-actions"><Button variant="outline" onClick={() => setShowImport(true)}><IconUpload size={16} />Import CSV</Button>{deck && <Button variant="outline" disabled={openingAgent || dirty} onClick={() => void ask(true)}><IconMessage size={16} />{openingAgent ? "Opening agent…" : "Review deck"}</Button>}{deck && <Button asChild variant="outline" disabled={!approved || dirty}><a aria-disabled={!approved || dirty} href={approved && !dirty ? `/api/proof?id=${deck.id}&revision=${deck.revision}` : undefined} onClick={e => { if (!approved || dirty) e.preventDefault(); }}><IconDownload size={16} />PDF proof</a></Button>}</div></header>
    <div className="pd-project-tabs" aria-label="Your decks">{projects.data?.decks.map(project => <Button key={project.id} variant={id === project.id ? "secondary" : "ghost"} size="sm" onClick={() => { if (dirty) toast.error("Save wording before switching decks."); else setParams({ id: project.id }); }}>{project.name}</Button>)}</div>
    {!id ? <section className="pd-empty"><div className="pd-empty-card" aria-hidden="true">Aa<span>63 × 88 mm</span></div><h1>Give every language room to play.</h1><p>Bring your card text. Review the translation in its real layout, with an agent at the copy desk.</p><div><Button onClick={() => setShowImport(true)}>Import your deck<IconArrowRight size={16} /></Button><Button variant="outline" disabled={importer.isPending} onClick={() => void sample()}>{importer.isPending ? "Opening…" : "Try the example deck"}</Button></div><small>The example contains original, synthetic cards with deliberately seeded errors.</small></section>
    : deckQuery.isPending ? <div className="pd-skeleton" aria-label="Opening deck"><div /><div /><div /></div>
    : deckQuery.error ? <div role="alert" className="pd-empty"><p>{actionErrorMessage(deckQuery.error) ?? "Cannot open this deck."}</p><Button onClick={() => setParams({})}>Back to decks</Button></div>
    : deck && <>
      <div className="pd-deck-heading"><div><h1>{deck.name}</h1><p>English <IconArrowRight size={12} />{deck.content.language}<span>63 × 88 mm · 10 pt fixed</span></p></div><div><Button size="sm" variant="ghost" onClick={() => { setGlossary(deck.content.glossary.map(t => `${t.source} = ${t.target}`).join("\n")); setShowGlossary(true); }}>Glossary</Button><Button size="sm" variant="ghost" onClick={() => setShowHistory(v => !v)}><IconHistory size={15} />Revision {deck.revision}</Button></div></div>
      {showHistory && <section className="pd-history" aria-label="Revision history">{history.data?.revisions.map(r => <div key={r.revision}><strong>r{r.revision}</strong>{r.summary}<time>{new Date(r.createdAt).toLocaleTimeString()}</time></div>)}</section>}
      <div className="pd-statusbar"><button onClick={() => setOnlyFindings(v => !v)} className={findings.length ? "pd-warning" : "pd-clear"}>{checks.isFetching ? "Measuring the rendered layout…" : checks.error ? "Layout check failed — retry" : `${findings.length} finding${findings.length === 1 ? "" : "s"} · ${deck.content.cards.length} cards`}{onlyFindings ? " · showing flagged cards" : ""}</button>{checks.error ? <Button variant="ghost" size="sm" onClick={() => void checks.refetch()}>Retry check</Button> : <span>{approved ? "Revision approved for proof" : "Meaning review required"}</span>}</div>
      <div className="pd-editing-grid"><section className="pd-canvas" aria-label="Card layout"><div className="pd-cards">{deck.content.cards.filter(c => !onlyFindings || findings.some(f => f.cardId === c.id)).map(c => { const p = deck.content.proposals.find(p => p.cardId === c.id); const count = findings.filter(f => f.cardId === c.id).length; return <div className="pd-card-wrap" key={c.id}><PhysicalCard card={dirty && c.id === card?.id ? { ...c, text: wording } : preview && p && c.id === card?.id ? { ...c, text: p.text } : c} language={deck.content.language} selected={c.id === card?.id} onClick={() => { if (dirty) toast.error("Save wording before switching cards."); else setParams({ id, card: c.id }); }} /><div className={count ? "pd-card-caption pd-warning" : "pd-card-caption"}><span>{c.id} · {count ? `${count} finding${count > 1 ? "s" : ""}` : "Checks clear"}</span>{p && <span className="pd-proposal-tag">Proposal</span>}</div></div>; })}</div><p className="pd-canvas-note">Physical dimensions stay fixed. Mechanical checks support your review of the game rules.</p></section>
      {card && <section className="pd-copy-desk" aria-label="Copy desk"><div className="pd-section-label">COPY DESK <span>{card.id}</span></div><h2>{card.name}</h2><label className="pd-label">ENGLISH SOURCE</label><blockquote>{card.source}</blockquote><label className="pd-label" htmlFor="pd-wording">{deck.content.language.toUpperCase()} WORDING</label><Textarea id="pd-wording" value={wording} onChange={e => setWording(e.target.value)} rows={5} /><div className="pd-editor-actions"><Button variant="outline" size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate({ id, revision: deck.revision, edits: [{ cardId: card.id, text: wording }] })}>{save.isPending ? "Saving…" : "Save wording"}</Button><Button size="sm" onClick={() => void ask()} disabled={dirty || openingAgent}><IconMessage size={15} />{openingAgent ? "Opening…" : "Ask agent"}</Button></div>
        {proposal && <section className="pd-proposal" aria-label="Proposed wording"><div className="pd-proposal-heading"><strong>{proposal.origin === "agent" ? "Agent proposal" : "Editor proposal"}</strong><label><input type="checkbox" checked={preview} onChange={e => setPreview(e.target.checked)} />Preview</label></div><div className="pd-diff"><del>{proposal.before}</del><ins>{proposal.text}</ins></div><p>{proposal.reason}</p><div className="pd-editor-actions"><Button size="sm" disabled={review.isPending || dirty} onClick={() => review.mutate({ id, revision: deck.revision, proposalId: proposal.id, decision: "accept" })}>Accept wording</Button><Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id, revision: deck.revision, proposalId: proposal.id, decision: "reject" })}>Reject</Button></div></section>}
        <label className="pd-label">SAVED WORDING CHECKS</label>{dirty ? <div className="pd-finding">Unsaved preview. Save wording to run its checks.</div> : selectedFindings.length ? selectedFindings.map((f, i) => <div className="pd-finding" key={i}>{f.message}</div>) : <div className="pd-success"><IconCheck size={15} />{checks.isFetching ? "Measuring…" : "Mechanical checks clear"}</div>}
        <div className="pd-approval"><label><input type="checkbox" checked={reviewed || approved} disabled={approved} onChange={e => setReviewed(e.target.checked)} />I reviewed the meaning of this entire revision. Export an editorial proof for further review.</label><Button variant="outline" disabled={!reviewed || approved || approve.isPending || !!findings.length || !!checks.error || checks.isFetching || !!deck.content.proposals.length || dirty} onClick={() => approve.mutate({ id, revision: deck.revision })}>{approve.isPending ? "Verifying revision…" : approved ? "Revision approved" : "Approve revision"}</Button><small>Approval is revoked by any edit. PDF is an RGB editorial proof; production prepress remains separate.</small></div>
      </section>}</div>
    </>}
    <Dialog open={showImport} onOpenChange={setShowImport}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Import a card deck</DialogTitle><DialogDescription>UTF-8 CSV, up to 100 cards. Required columns: id,name,source,text. Each ID must be unique.</DialogDescription></DialogHeader><label>Deck name<Input aria-label="Deck name" value={name} onChange={e => setName(e.target.value)} maxLength={100} /></label><label>Target language<Input aria-label="Target language" value={language} onChange={e => setLanguage(e.target.value)} maxLength={60} /></label><Input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={async e => { const file = e.target.files?.[0]; if (file) { if (file.size > 1_000_000) toast.error("CSV must be smaller than 1 MB."); else { setCsv(await file.text()); if (!name) setName(file.name.replace(/\.csv$/i, "")); } } }} /><Textarea aria-label="CSV content" rows={6} value={csv} onChange={e => setCsv(e.target.value)} placeholder={'id,name,source,text\nC01,Silver Key,Gain 2 {GOLD}.,Erhalte 2 {GOLD}.'} /><Button disabled={!name.trim() || !language.trim() || !csv || importer.isPending} onClick={() => importer.mutate({ name, language, csv })}>{importer.isPending ? "Importing…" : "Import deck"}</Button></DialogContent></Dialog>
    <Dialog open={showGlossary} onOpenChange={setShowGlossary}><DialogContent><DialogHeader><DialogTitle>Game glossary</DialogTitle><DialogDescription>One source term = target stem per line. Checks allow plurals containing the target stem; they do not prove a grammatically correct translation.</DialogDescription></DialogHeader><Textarea aria-label="Glossary terms" rows={6} value={glossary} onChange={e => setGlossary(e.target.value)} /><Button disabled={save.isPending} onClick={() => { if (!deck) return; const lines = glossary.split("\n").filter(x => x.trim()); if (lines.some(x => x.split("=").length !== 2 || x.split("=").some(v => !v.trim()))) { toast.error("Use source = target on each line."); return; } save.mutate({ id, revision: deck.revision, glossary: lines.map(x => { const [source, target] = x.split("="); return { source: source.trim(), target: target.trim() }; }) }, { onSuccess: () => setShowGlossary(false) }); }}>Save glossary</Button></DialogContent></Dialog>
  </div>;
}
