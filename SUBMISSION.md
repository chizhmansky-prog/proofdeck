# ProofDeck — submission draft

## Pitch

**A new language. The same game.** ProofDeck is a localization copy desk for
tabletop cards. Editors and an AI agent work on one saved deck, with actual
physical card layouts in view. The agent proposes concise wording, the app
measures it at fixed 10 pt, and the editor reviews meaning before releasing a
PDF proof of that exact revision.

## Problem and workflow

A translation can be fluent and still overflow a card, change a printed number,
swap a game symbol, or drift away from the glossary. Fixing the words separately
from layout creates repeated handoffs. ProofDeck puts source, wording, layout,
agent proposals, checks and revision approval in the same editing loop.

Import CSV → inspect actual cards → ask the agent → compare proposed wording →
accept or reject → review the entire revision → download its editorial PDF.

## Agent-Native use

Built from the official Chat scaffold with `@agent-native/core` 0.220.0. Domain
operations are typed `defineAction` modules shared by the UI and agent. Decks,
proposals, glossary, history and approvals live in PostgreSQL-compatible PGlite
locally. Navigation and selection are exposed to the agent. The shared
AgentSidebar uses a custom HTTP `AgentChatRuntime` and an authenticated local
Codex CLI session. The agent reads the deck, stages proposals and measures their
actual Chromium layout through the same actions used by the UI.

Meaning approval remains an explicit editor decision. Mechanical checks never
prove that a translation preserves all game rules. Edits invalidate approval,
and stale revisions/proposals cannot overwrite newer work.

## Novelty claim, carefully scoped

Existing card editors and localization tools already support many of these
individual capabilities, including AI integrations. We claim an integrated,
reviewable working loop; we have not established superiority in a comparative
user study. We do not claim that this workflow is impossible with other tools.

## Provenance and limitations

- Official Agent-Native Chat template and published open-source dependencies.
- ProofDeck domain implementation and synthetic example cards created during
  the allowed development period. Initial browser/PDF prototype is included
  and disclosed in this repository's history.
- Original geometric SVG card illustration; DejaVu Sans with its license notice.
- Example errors are deliberately seeded and disclosed. Prepared wording in
  the earlier offline prototype is separate from live model-generated proposals.
- Local single-owner MVP. Public hosting of a user's Codex subscription is not
  enabled. Hosted production needs a dedicated isolated agent host.
- Export is an RGB editorial proof, not certified PDF-X/CMYK prepress output.
- Human usability, independent QA and fair competitor comparisons remain
  unverified unless the final verification report records actual results.

## Required submission fields — pending account input

Project: ProofDeck

Public Clips recording URL: PENDING — must be created in the participant's account.

Repository URL: PENDING — GitHub authentication/repository not connected here.

Live hosted URL: not deployed; optional under the event rules reviewed.

Official form receipt: PENDING — a local recording is not a received submission.

Participant age, eligibility confirmations and any payment/tax details must be
provided by the participant. Do not invent them.
