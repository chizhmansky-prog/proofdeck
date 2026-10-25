"""Contract, persistence and real PDF checks against the running local app.

Uses the official action HTTP surface as a client, with a previously established
local-dev browser session. It never creates an external account or mocks a model.
"""
from pathlib import Path
from io import BytesIO
from datetime import datetime, timezone
import json
from pypdf import PdfReader
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8081"
checks = []

def record(name, condition, detail=None):
    assert condition, f"{name}: {detail}"
    checks.append({"name": name, "pass": True, "detail": detail})

with sync_playwright() as p:
    api = p.request.new_context(storage_state=".cache/browser-state.json")
    def action(name, args, method="POST", status=200):
        response = api.get(BASE + "/_agent-native/actions/" + name, params=args) if method == "GET" else api.post(BASE + "/_agent-native/actions/" + name, data=args)
        assert response.status == status, (name, response.status, response.text()[:1200])
        return response.json()
    before = action("list-decks", {}, "GET")
    for title, csv in [
        ("Duplicate IDs", 'id,name,source,text\nX,One,Gain 1.,Erhalte 1.\nX,Two,Gain 2.,Erhalte 2.'),
        ("Unclosed quote", 'id,name,source,text\nX,One,Gain 1.,"Erhalte 1.'),
        ("Duplicate header", 'id,name,source,text,text\nX,One,A,B,C'),
    ]:
        action("import-deck", {"name": title, "language": "German", "csv": csv}, status=400)
        record(title + " rejected atomically", len(action("list-decks", {}, "GET")["decks"]) == len(before["decks"]))
    csv = '\ufeffid,name,source,text\r\nQA01,"Harbor, Ledger",Gain 2 {GOLD}.,Erhalte 2 {GOLD}.\r\nQA02,Quiet Choice,You may draw 1 card.,Du darfst 1 Karte ziehen.\r\n'
    imported = action("import-deck", {"name": "Contract verification " + datetime.now(timezone.utc).isoformat(timespec="seconds"), "language": "German", "csv": csv})
    id = imported["id"]
    def read(): return action("get-deck", {"id": id}, "GET")
    deck = read(); record("BOM, CRLF and quoted commas imported", deck["content"]["cards"][0]["name"] == "Harbor, Ledger")
    original = [c["source"] for c in deck["content"]["cards"]]
    layout = action("inspect-layout", {"id": id, "variant": "current"}, "GET")
    record("Actual Chromium layout clear at fixed 10 pt", not layout["findings"] and all(abs(x["fontPt"] - 10) < .001 for x in layout["layout"]))
    action("propose-copy", {"id": id, "revision": 1, "proposals": [{"cardId": "QA01", "text": "Du erhältst 2 {GOLD}.", "reason": "Synthetic proposal to test stale-state handling."}]})
    proposal = read()["content"]["proposals"][0]
    action("approve-proof", {"id": id, "revision": 2}, status=409); record("Pending proposal blocks approval", True)
    action("update-deck", {"id": id, "revision": 2, "edits": [{"cardId": "QA01", "text": "Nimm 2 {GOLD}."}]})
    action("review-copy", {"id": id, "revision": 3, "proposalId": proposal["id"], "decision": "accept"}, status=409)
    record("Stale proposal cannot overwrite manual copy", read()["content"]["cards"][0]["text"] == "Nimm 2 {GOLD}.")
    action("review-copy", {"id": id, "revision": 3, "proposalId": proposal["id"], "decision": "reject"})
    action("update-deck", {"id": id, "revision": 1, "edits": [{"cardId": "QA01", "text": "Erhalte 9 {GOLD}."}]}, status=409)
    record("Stale revision rejected without overwrite", read()["revision"] == 4)
    action("approve-proof", {"id": id, "revision": 4})
    record("Approval bound to exact persisted revision", read()["approvedRevision"] == 4)
    response = api.get(BASE + f"/api/proof?id={id}&revision=4")
    record("Authenticated PDF download", response.status == 200 and response.headers.get("content-type", "").startswith("application/pdf"), response.status)
    pdf = response.body(); Path("artifacts/app-contract-proof.pdf").write_bytes(pdf); reader = PdfReader(BytesIO(pdf))
    record("Real PDF pages have exact nominal 63 × 88 mm boxes", len(reader.pages) == 2 and all(abs(float(x.mediabox.width) - 63/25.4*72) < .0001 and abs(float(x.mediabox.height) - 88/25.4*72) < .0001 for x in reader.pages))
    text = "\n".join(x.extract_text() for x in reader.pages)
    record("PDF contains accepted content and stable IDs", all(x in text for x in ["QA01", "QA02", "Nimm 2", "Du darfst 1 Karte ziehen"]))
    action("update-deck", {"id": id, "revision": 4, "edits": [{"cardId": "QA01", "text": "Nimm 9 {GOLD}."}]})
    record("Any edit revokes approval", read()["approvedRevision"] is None)
    record("Old approved revision cannot be exported after edit", api.get(BASE + f"/api/proof?id={id}&revision=4").status == 409)
    action("approve-proof", {"id": id, "revision": 5}, status=409); record("Bad printed number blocks approval on server", True)
    action("update-deck", {"id": id, "revision": 5, "edits": [{"cardId": "QA01", "text": "Nimm 2 {GOLD}."}, {"cardId": "QA02", "text": "Du musst 1 Karte ziehen."}]})
    layout = action("inspect-layout", {"id": id, "variant": "current"}, "GET")
    record("Known semantic counterexample remains explicitly unapproved", not layout["findings"] and read()["approvedRevision"] is None, "may → must passes mechanical checks; human meaning review required")
    record("Original source text immutable across writes", [c["source"] for c in read()["content"]["cards"]] == original)
    history = action("deck-history", {"id": id}, "GET")
    record("Committed changes have durable revision history", [r["revision"] for r in history["revisions"]] == list(range(6, 0, -1)))
    action("get-deck", {"id": "missing' OR 1=1 --"}, "GET", status=404); record("Unknown/malicious ID does not broaden authorized read", True)
    unauth = p.request.new_context(); response = unauth.get(BASE + "/_agent-native/actions/get-deck", params={"id": id}, max_redirects=0)
    record("Unauthenticated caller cannot read deck data", response.status in (302, 401, 403) and "Harbor, Ledger" not in response.text(), response.status)
    unauth.dispose(); api.dispose()
    result = {"time_utc": datetime.now(timezone.utc).isoformat(), "checks": checks, "total": len(checks), "deck_id": id, "scope": "Developer-authored real HTTP/Chromium/PDF verification, not independent QA or human study", "live_model": "separately captured in live-agent-stream.txt", "restart": "NOT_RUN"}
    Path("artifacts/app-verification.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
    Path(".cache/restart-deck.json").write_text(json.dumps({"id": id, "revision": 6, "expected_text": "Du musst 1 Karte ziehen."}))
    print(json.dumps(result, indent=2, ensure_ascii=False))
