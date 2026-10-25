from pathlib import Path
from datetime import datetime, timezone
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(storage_state=".cache/browser-state.json", viewport={"width": 390, "height": 844})
    page = context.new_page(); errors = []; passed = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(Path(".cache/demo-url").read_text())
    page.get_by_role("heading", name="Harbor & Moon — live demo", exact=True).wait_for(timeout=60000)
    page.evaluate("window.dispatchEvent(new CustomEvent('agent-panel:close'))")
    page.wait_for_function("document.documentElement.scrollWidth <= innerWidth + 1")
    page.screenshot(path="artifacts/mobile.png", full_page=True)
    passed.append("390 px viewport has no horizontal page overflow")
    page.get_by_role("button", name="Import CSV", exact=True).click()
    dialog = page.get_by_role("dialog"); dialog.wait_for()
    name = page.get_by_role("textbox", name="Deck name", exact=True)
    name.focus(); page.keyboard.press("Tab")
    assert page.get_by_role("textbox", name="Target language", exact=True).evaluate("e => document.activeElement === e")
    page.keyboard.press("Escape"); dialog.wait_for(state="hidden")
    passed.append("Import dialog follows keyboard Tab; Escape dismisses it")
    page.set_viewport_size({"width": 1640, "height": 1050})
    editor = page.get_by_label("GERMAN WORDING")
    editor.fill("Bewege dich bis zu 5 {STEP}. Du darfst 1 {SHIELD} erhalten. TEMP")
    assert "TEMP" in page.locator('.pd-card[data-card-id="H02"]').inner_text()
    page.get_by_role("button", name="Edit Harbor Ledger", exact=True).click()
    assert editor.input_value().endswith("TEMP")
    assert page.get_by_text("Save wording before switching cards.", exact=True).is_visible()
    assert page.locator(".pd-toolbar-actions a").get_attribute("aria-disabled") == "true"
    passed.append("Unsaved wording previews immediately and blocks switching/export")
    page.reload()
    page.get_by_role("heading", name="Harbor & Moon — live demo", exact=True).wait_for(timeout=45000)
    assert not page.get_by_label("GERMAN WORDING").input_value().endswith("TEMP")
    passed.append("Reload restores saved wording instead of unsaved preview")
    page.goto("http://127.0.0.1:8081/")
    page.get_by_role("button", name="Import CSV", exact=True).wait_for(timeout=45000)
    assert "/decks" in page.url
    passed.append("Authenticated root lands on the domain route")
    assert not errors, errors
    result = {"time_utc": datetime.now(timezone.utc).isoformat(), "status": "PASS", "checks": passed, "page_errors": errors}
    Path("artifacts/ui-verification.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    browser.close()
