import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { cardCss, renderCard, escapeHtml } from "../../shared/card-renderer";
import { checkCopy, type DeckContent } from "../../shared/deck";

export async function renderProof(content: DeckContent, pdf = false) {
  const executablePath = resolve(process.cwd(), "../.browsers/chromium-1248/chrome-linux64/chrome");
  if (!existsSync(executablePath)) throw new Error("Chromium unavailable. Run the project browser installer before starting ProofDeck.");
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const font = readFileSync(resolve(process.cwd(), "public/fonts/DejaVuSans.ttf")).toString("base64");
    const css = cardCss.replace("/fonts/DejaVuSans.ttf", `data:font/ttf;base64,${font}`);
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(content.language)} card proof</title><style>${css}</style><body>${content.cards.map(c => renderCard(c, content.language)).join("")}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.locator(".pd-card").evaluateAll(nodes => nodes.map(node => {
      const copy = node.querySelector<HTMLElement>(".pd-copy"); const zone = node.querySelector<HTMLElement>(".pd-zone"); const title = node.querySelector<HTMLElement>(".pd-card-name");
      if (!copy || !zone || !title) throw new Error("Card renderer contract failed.");
      return { cardId: node.getAttribute("data-card-id") ?? "", overflowPx: Math.max(0, copy.getBoundingClientRect().bottom - zone.getBoundingClientRect().bottom, copy.scrollWidth - zone.clientWidth), titleOverflow: title.scrollHeight > title.clientHeight + 1 || title.scrollWidth > title.clientWidth + 1, fontPt: Number.parseFloat(getComputedStyle(copy).fontSize) * 72 / 96 };
    }));
    const findings = content.cards.flatMap(c => checkCopy(c, content.glossary));
    for (const c of layout) { if (c.overflowPx > .5) findings.push({ cardId: c.cardId, kind: "layout", message: `Text exceeds its fixed 10 pt copy area by ${c.overflowPx.toFixed(1)} px.` }); if (c.titleOverflow) findings.push({ cardId: c.cardId, kind: "layout", message: "Card title exceeds its title area." }); }
    let bytes = pdf && findings.length === 0 ? await page.pdf({ width: "63mm", height: "88mm", printBackground: true, preferCSSPageSize: true }) : null;
    if (bytes) { const document = await PDFDocument.load(bytes); for (const p of document.getPages()) { p.setMediaBox(0, 0, 63 / 25.4 * 72, 88 / 25.4 * 72); p.setCropBox(0, 0, 63 / 25.4 * 72, 88 / 25.4 * 72); } bytes = Buffer.from(await document.save()); }
    return { findings, layout, pdf: bytes };
  } finally { await browser.close(); }
}
