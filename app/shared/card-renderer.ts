import type { Card } from "./deck";
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
export const cardCss = `
@font-face{font-family:Deck;src:url('/fonts/DejaVuSans.ttf') format('truetype');font-display:block}
.pd-card{box-sizing:border-box;width:63mm;height:88mm;position:relative;background:#fffcef;color:#263c2f;border:1px solid #6a7b60;border-radius:10px;text-align:left;font-family:Deck,sans-serif;flex-shrink:0;overflow:hidden}
.pd-card-name{position:absolute;top:13px;left:15px;right:15px;font-weight:bold;font-size:12pt;line-height:1.15;max-height:37px;overflow:hidden}
.pd-card-type{position:absolute;left:16px;top:48px;font-size:6.5px;letter-spacing:1.5px;color:#74816b}
.pd-art{position:absolute;left:15px;right:15px;top:63px;height:93px;border-radius:6px;background:#dce3d1;overflow:hidden}.pd-art svg{width:100%;height:100%}
.pd-zone{position:absolute;left:16px;right:16px;top:174px;height:102px;overflow:visible}
.pd-copy{font-family:Deck,sans-serif;font-size:10pt;line-height:1.3;margin:0;color:#263c2f;white-space:pre-wrap;overflow-wrap:normal}
.pd-symbol{display:inline-flex;align-items:center;justify-content:center;vertical-align:baseline;width:15px;height:15px;border:1px solid currentColor;border-radius:50%;font-size:10px;line-height:12px;font-weight:bold}
.pd-card-id{position:absolute;bottom:12px;left:16px;color:#737c66;font-size:8px}.pd-rule{position:absolute;bottom:15px;right:16px;width:29px;border-top:2px solid #bac3a9}
@media print{@page{size:63mm 88mm;margin:0}html,body{margin:0!important;padding:0!important;background:white}.pd-card{border-radius:0;break-after:page;box-shadow:none}.pd-card:last-child{break-after:auto}}
`;
export function renderCard(card: Card, language: string) {
  const rich = escapeHtml(card.text).replace(/\{(GOLD|SHIELD|STEP)\}/g, (_m, t: string) => `<span class="pd-symbol" title="${t}">${({ GOLD: "G", SHIELD: "S", STEP: "➜" } as Record<string, string>)[t]}</span>`);
  return `<article class="pd-card" data-card-id="${escapeHtml(card.id)}"><div class="pd-card-name">${escapeHtml(card.name)}</div><div class="pd-card-type">ACTION / LOCALIZATION PROOF</div><div class="pd-art"><svg viewBox="0 0 208 100" aria-hidden="true"><g fill="none" stroke="#667b56" stroke-width="1.2"><circle cx="104" cy="51" r="36"/><circle cx="104" cy="51" r="29" stroke-dasharray="2 5"/><path d="M18 78 L53 47 L74 65 L104 13 L140 72 L167 41 L193 78 M12 86 Q70 64 104 83 T199 79"/><path d="M77 67 L104 24 L132 67 Z" stroke-width="2"/></g><circle cx="104" cy="51" r="7" fill="#667b56"/></svg></div><div class="pd-zone"><p class="pd-copy">${rich}</p></div><span class="pd-card-id">${escapeHtml(card.id)} / ${escapeHtml(language.slice(0, 12))} · PROOF</span><span class="pd-rule"></span></article>`;
}
