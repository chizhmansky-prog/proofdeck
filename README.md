# ProofDeck

**A new language. The same game.** An Agent-Native localization copy desk:
CSV → actual card layout → live agent proposal → editor review → PDF proof.

The editor and agent share typed actions and one PostgreSQL-compatible store.
Wording, glossary, proposals and history persist in local PGlite. Chromium
measures the real card at fixed 10 pt; it never silently shrinks overflowing text.

## Run locally

Linux x86-64, npm, and an authenticated official Codex CLI are required. The
installer uses project-local Node 22.22.0 and pnpm 10.29.1. It does not change
global Node settings or copy account credentials.

```sh
./setup.sh
codex login status     # run codex login if not yet authenticated
./start.sh
```

Open **http://127.0.0.1:8081/decks**. Choose **Continue as local dev** when
offered. Try the original example or import UTF-8 CSV with columns
`id,name,source,text`: unique IDs, 1–100 cards, up to 1 MB. Source is English;
target language is entered at import.

Choose a card and **Ask agent**, or **Review deck**. Follow-ups stay in the shared
sidebar. The agent reads current data, stages proposals through the same actions
as the UI, and checks the actual layout. Accept/reject wording, review meaning
for the entire revision, then approve before **PDF proof**. Edits revoke approval.

The font supports Latin-script examples such as German. CJK/Arabic typography
and arbitrary production templates have not been validated. Only the fixed
63 × 88 mm template ships in this MVP.

## Evidence

- [Delivery report and open criteria](REPORT.md).
- [Action/PDF checks](artifacts/app-verification.json) and
  [actual process restart](artifacts/restart-verification.json).
- [Demo verification](artifacts/demo-verification.json),
  [recorded walkthrough](artifacts/proofdeck-demo.mp4),
  [PDF downloaded through the app](artifacts/demo-approved-proof.pdf).
- [Submission and disclosures](SUBMISSION.md), [demo script](DEMO.md).
- [Research and competitors](STRATEGY.md).

Cards and seeded errors are synthetic and original. Demo interactions are
automated and disclosed; the model is live. Developer checks are not independent
QA or a human localization study. No measured superiority over existing editors
or a strong GPT workflow is claimed.

## Verify

With the app running, Python tools can exercise the actual action endpoints and
PDF downloads. They are optional for using the product:

```sh
uv venv --python /usr/bin/python3 .venv
uv pip install --python .venv/bin/python -r requirements.lock
PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" .venv/bin/python verify_app.py
PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" .venv/bin/python record_demo.py
```

The scripts use `.cache/browser-state.json`, a private ignored local-dev browser
session. Establish it through the app's local sign-in; never publish that file.
From `app/`, with the project-local toolchain on `PATH`, run:

```sh
pnpm typecheck
pnpm agent-native:doctor
```

The initial offline experiment remains in `ui.html`, `build.py`, `probe.py` and
`artifacts/preview.html`. Its prepared wording is separate from the live
Agent-Native application in `app/`.

## Scope and hosting

Local single-owner hackathon MVP. The Node server, Codex login and Chromium run
on your computer. The local Codex bridge is disabled in production mode. Public
hosting requires a dedicated isolated agent host and persistent PostgreSQL. The
available Sites host uses Cloudflare Workers and cannot execute this CLI stack.

Numbers, token multisets, glossary stems and layout are mechanical checks. They
cannot establish semantic equivalence: “may” becoming “must” can pass. Approval
records an editor decision, not an automatic linguistic certification. PDF is an
RGB editorial proof with exact nominal page boxes, not certified PDF-X/CMYK or
physically tested prepress output.

Public repository, Clips URL and form receipt remain pending participant account
connection. A local recording is not a received hackathon submission.

## Credits

Agent-Native Chat template/Core/Toolkit/AgentKit: Builder.io, MIT; see
[framework license](third_party/agent-native-MIT.txt). Card art and example data
are original. DejaVu Sans notice is in `app/public/fonts/LICENSE.txt`. Other
dependencies retain their own licenses.
