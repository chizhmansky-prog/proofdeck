"""Record the real UI path, including a live agent call. No response mocking."""
from pathlib import Path
from io import BytesIO
from datetime import datetime, timezone
import json
import re
from pypdf import PdfReader
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8081"
csv = '''id,name,source,text
H01,Harbor Ledger,Spend 4 {GOLD} to draw 2 cards.,Zahle 3 {SHIELD} und ziehe 2 Karten.
H02,Night Courier,Move up to 5 {STEP}. You may gain 1 {SHIELD}.,Bewege deine Spielfigur auf dem gesamten Spielplan um bis zu 5 {STEP} weit in eine Richtung deiner Wahl. Wenn du diese Bewegung vollständig abgeschlossen hast darfst du anschließend als freiwilligen zusätzlichen Schritt dieser Aktion insgesamt 1 {SHIELD} für deine Spielfigur erhalten und auf deinem persönlichen Spielertableau ablegen.
'''
(ROOT / "artifacts/demo-input.csv").write_text(csv)
errors, failures, stream = [], [], []
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(storage_state=str(ROOT / ".cache/browser-state.json"), viewport={"width": 1640, "height": 1050}, record_video_dir=str(ROOT / "artifacts/video-raw"), record_video_size={"width": 1640, "height": 1050}, reduced_motion="reduce")
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response", lambda r: failures.append({"status": r.status, "url": r.url}) if r.status >= 400 else None)
    page.goto(BASE + "/decks")
    page.get_by_role("button", name="Import CSV", exact=True).wait_for(timeout=60000)
    reject = page.get_by_role("button", name="Reject all", exact=True)
    if reject.is_visible(): reject.click()
    page.get_by_role("button", name="Import CSV", exact=True).click()
    page.get_by_role("textbox", name="Deck name", exact=True).fill("Harbor & Moon — live demo")
    page.get_by_role("textbox", name="CSV content", exact=True).fill(csv)
    page.wait_for_timeout(2000)
    page.get_by_role("button", name="Import deck", exact=True).click()
    page.get_by_role("heading", name="Harbor & Moon — live demo", exact=True).wait_for(timeout=30000)
    page.get_by_role("button", name="Review deck", exact=True).wait_for(state="visible")
    page.wait_for_timeout(2500)
    page.screenshot(path=str(ROOT / "artifacts/demo-before.png"), full_page=True)
    start = datetime.now(timezone.utc)
    with page.expect_response(lambda r: r.url.endswith("/api/proofdeck-agent"), timeout=180000) as agent:
        page.get_by_role("button", name="Review deck", exact=True).click()
    response = agent.value
    print("AGENT_ACCEPTED", response.status, flush=True)
    assert response.status == 200
    page.get_by_role("button", name="Accept wording", exact=True).wait_for(timeout=180000)
    page.wait_for_function("document.body.innerText.includes('proposal(s) saved for your review.')", timeout=180000)
    live_seconds = (datetime.now(timezone.utc) - start).total_seconds()
    final_agent_text = page.locator("body").inner_text()
    assert "The agent run failed before it finished" not in final_agent_text
    (ROOT / "artifacts/demo-agent-visible.txt").write_text(final_agent_text)
    print("LIVE_MODEL_COMPLETE", live_seconds, flush=True)
    page.wait_for_timeout(2500)
    page.screenshot(path=str(ROOT / "artifacts/demo-proposal.png"), full_page=True)
    page.get_by_role("button", name="Accept wording", exact=True).click()
    page.wait_for_timeout(1800)
    page.get_by_role("button", name="Edit Night Courier", exact=True).click()
    page.get_by_role("button", name="Accept wording", exact=True).wait_for(timeout=10000)
    page.screenshot(path=str(ROOT / "artifacts/demo-layout-proposal.png"), full_page=True)
    page.wait_for_timeout(2000)
    page.get_by_role("button", name="Accept wording", exact=True).click()
    page.wait_for_timeout(2000)
    page.get_by_label("I reviewed the meaning of this entire revision.", exact=False).check()
    page.get_by_role("button", name="Approve revision", exact=True).click()
    page.get_by_role("button", name="Revision approved", exact=True).wait_for(timeout=30000)
    with page.expect_download() as downloaded:
        page.get_by_role("link", name="PDF proof", exact=True).click()
    pdf_path = ROOT / "artifacts/demo-approved-proof.pdf"
    downloaded.value.save_as(str(pdf_path))
    reader = PdfReader(BytesIO(pdf_path.read_bytes()))
    assert len(reader.pages) == 2
    assert all(abs(float(x.mediabox.width) - 63/25.4*72) < .0001 for x in reader.pages)
    assert "H01" in reader.pages[0].extract_text() and "H02" in reader.pages[1].extract_text()
    page.screenshot(path=str(ROOT / "artifacts/demo-approved.png"), full_page=True)
    url = page.url
    page.reload()
    page.get_by_role("button", name="Revision approved", exact=True).wait_for(timeout=45000)
    page.get_by_role("button", name=re.compile(r"^Revision \d+$")).click()
    page.get_by_label("Revision history").wait_for()
    page.wait_for_timeout(2500)
    page.screenshot(path=str(ROOT / "artifacts/demo-history.png"), full_page=True)
    context.storage_state(path=str(ROOT / ".cache/browser-state.json"))
    video = page.video
    page.close(); context.close()
    assert video
    video.save_as(str(ROOT / "artifacts/proofdeck-demo.webm"))
    browser.close()
    report = {"time_utc": datetime.now(timezone.utc).isoformat(), "status": "PASS", "path": "UI CSV import → live native agent → proposal preview/review → revision approval → real PDF download → reload/history", "url": url, "model_wait_seconds": live_seconds, "page_errors": errors, "http_failures": failures, "agent_ui_terminal_result": "Completed reply and persisted proposals observed; raw SSE body not captured by this UI test", "pdf_pages": len(reader.pages), "recording": "proofdeck-demo.webm", "disclosure": "Developer-created synthetic cards, automated editor interaction; live model output is not mocked. Not a human linguistic review or independent QA."}
    (ROOT / "artifacts/demo-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    (ROOT / ".cache/demo-url").write_text(url)
    print(json.dumps(report, ensure_ascii=False, indent=2))
