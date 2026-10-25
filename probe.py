"""Known-case browser/PDF probe; no autonomous model or operator A/B."""
from datetime import datetime, timezone
from hashlib import sha256
from importlib.metadata import version
import json
import os
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
from playwright.sync_api import sync_playwright

from build import build

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "artifacts"
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(ROOT / ".browsers")


def main():
    build()
    original_data = (ROOT / "data/cards.json").read_bytes()
    errors = []
    with sync_playwright() as driver:
        browser = driver.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1050}, device_scale_factor=1)
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto((OUT / "preview.html").as_uri())
        page.evaluate("document.fonts.ready")
        page.wait_for_function("document.querySelectorAll('#cards .card').length===6")
        draft = page.evaluate("ProofDeck.getChecks()")
        assert {c["id"] for c in draft if c["issues"]} == {"A02", "A03", "A04", "A05"}, draft
        assert next(c for c in draft if c["id"] == "A02")["overflow_px"] > 0
        assert page.locator("#print").is_disabled()
        page.screenshot(path=str(OUT / "draft.png"), full_page=True)

        # Real UI button, followed by a new geometry measurement.
        page.get_by_role("button", name="Load edited copy").click()
        edited = page.evaluate("ProofDeck.getChecks()")
        assert all(not c["issues"] for c in edited), edited
        assert all(abs(c["font_px"] - 40/3) < 0.01 for c in draft + edited), "Unexpected type shrinking"
        assert page.locator("#print").is_disabled(), "A clear mechanical check must not imply human approval"
        page.locator("#review").check()
        assert page.locator("#print").is_enabled()

        # Edit the actual textarea: previous approval must be reset.
        page.get_by_role("button", name="Edit Amber Coin").click()
        page.get_by_label("German card wording").fill("Erhalte 9 {GOLD}.")
        assert not page.locator("#review").is_checked()
        assert page.locator("#print").is_disabled()
        assert any("number" in s for s in page.evaluate("ProofDeck.getChecks()")[0]["issues"])
        page.get_by_role("button", name="Use prepared wording").click()

        # Counterevidence: mechanical equality is NOT semantic equivalence.
        page.evaluate("ProofDeck.setText('A05','Erhalte 1 {GOLD}. Du musst 1 Karte ziehen.')")
        semantics_case = page.evaluate("ProofDeck.getChecks()")[4]
        assert not semantics_case["issues"], semantics_case
        assert page.locator("#print").is_disabled(), "No implicit human approval"
        page.get_by_role("button", name="Load edited copy").click()
        page.get_by_role("button", name="Edit Windrunner").click()
        page.locator("#review").check()
        final = page.evaluate("ProofDeck.getChecks()")
        assert all(not c["issues"] for c in final)
        page.screenshot(path=str(OUT / "edited.png"), full_page=True)
        page.pdf(path=str(OUT / "chromium-raw-proof.pdf"), print_background=True, prefer_css_page_size=True)
        browser_version = browser.version
        browser.close()
    raw = PdfReader(OUT / "chromium-raw-proof.pdf")
    raw_sizes = [(float(p.mediabox.width), float(p.mediabox.height)) for p in raw.pages]
    width, height = 63/25.4*72, 88/25.4*72
    writer = PdfWriter()
    for raw_page in raw.pages:
        # Chromium rounds paper dimensions to device pixels. Set precise nominal
        # proof media boxes without scaling fonts or redrawing the page content.
        raw_page.mediabox = RectangleObject((0, 0, width, height))
        writer.add_page(raw_page)
    with (OUT / "german-card-proof.pdf").open("wb") as stream:
        writer.write(stream)
    reader = PdfReader(OUT / "german-card-proof.pdf")
    assert len(reader.pages) == 6, len(reader.pages)
    sizes = [(float(p.mediabox.width), float(p.mediabox.height)) for p in reader.pages]
    assert all(abs(w-width) < .0001 and abs(h-height) < .0001 for w,h in sizes), sizes
    text = "\n".join(p.extract_text() for p in reader.pages)
    assert all(card_id in text for card_id in ["A01", "A02", "A03", "A04", "A05", "A06"])
    assert "Bewege" in text and "Erhalte" in text
    assert (ROOT / "data/cards.json").read_bytes() == original_data
    assert not errors, errors
    result = {
        "at": datetime.now(timezone.utc).isoformat(), "technical_slice": "PASS",
        "playwright": version("playwright"), "chromium": browser_version,
        "fixtures": "developer-known original synthetic game; proposed copy authored by this assistant",
        "draft": draft, "edited": edited, "pdf_pages": len(reader.pages), "pdf_media_points": sizes,
        "raw_chromium_media_points": raw_sizes, "pdf_media_normalized_without_font_scaling": True,
        "font_size_unchanged": True, "approval_reset_after_edit": True, "source_unchanged": True,
        "semantic_counterexample": {"source_means": "may draw", "test_copy_means": "must draw",
                                     "mechanical_findings": semantics_case["issues"], "automatic_semantic_validation": False},
        "boundaries": ["prepared examples, no in-app model", "single built-in template", "RGB proof PDF, no PDF-X/CMYK verification", "no user/independent/holdout study"],
        "product_value_vs_strong_assistant": "NOT_RUN", "human_effort_reduction": "NOT_MEASURED",
        "agent_native_integration": "NOT_RUN", "independent_review": "NOT_RUN",
        "next_decision": "CONDITIONAL_GO_FOR_BOUNDED_MVP_PROPOSAL; no prize or improvement claim",
    }
    (OUT / "probe.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    files = [p for p in OUT.iterdir() if p.is_file() and p.name not in {"manifest.json", "probe.stdout.log", "probe.stderr.log", "install.log", "browser-install.log"}]
    files += [ROOT / n for n in ["build.py", "probe.py", "ui.html", "data/cards.json", "EXPERIMENT.md"]]
    (OUT / "manifest.json").write_text(json.dumps({str(p.relative_to(ROOT)):sha256(p.read_bytes()).hexdigest() for p in files}, indent=2) + "\n")
    print(json.dumps({k:v for k,v in result.items() if k not in {"draft", "edited", "pdf_media_points"}}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
