# ProofDeck: first admission slice

2026-10-25. Separate candidate for Builder.io Agent-Native. No code reused from
ImportLab, HouseLab or the previous hackathon task.

Research: Mindclash Games (2026-02-24) describes longer translated text and
editable production files; ITI's translator workflow requires terminology,
number/symbol and final-layout checks; Board Game Circus documents separate
translation/copyediting/PDF checking and hourly DTP. These are direct workflow
accounts, not measured demand for this app.

Closest alternatives already do much of this: Tabletop Creator has localization,
CSV data, print output and a Claude plugin; Component.Studio supports text fitting;
Algebras/gameloc/Overset check glossary, placeholders, numbers and length. No
claim of a new translation algorithm, global originality or guaranteed prize.

Product hypothesis: on repeated editorial changes, one shared card/data/review
surface reduces transfers between spreadsheet, assistant, layout tool and final
proof. Compare with a competent assistant plus those tools and reusable scripts,
including setup/import/review costs. The mere existence of a script is not a
reason to reject a useful product. A model prompt is not a deliberately weak baseline.

Smallest technical outcome: actual card data -> rendered physical-size card ->
fit/number/token/glossary findings -> explicit proposed copy -> browser rerender
and an exported vector PDF. Never hide overflow or silently reduce type size.

Acceptance command: `.venv/bin/python probe.py`. Test normal copy, an expanded
translation, a seeded changed number, a changed icon and a seeded glossary drift.
Report these as developer-known fixtures. Fit is checked by real Chromium layout,
not string length. Export PDF must keep 63 x 88 mm media and extractable text.
Preserving numbers/tokens does not prove preserved game meaning; human linguistic
approval remains necessary. A compact copy is prepared by this assistant, not
an autonomous in-app model. All fixture content/artwork belongs to this experiment.

Limit this first slice to one session / 20 minutes of local implementation. No
global installs, accounts or live deployments. A technical pass permits a bounded
MVP proposal; it is not a claim that the product beats the alternatives. Before
claiming improvement require same-tool baseline, unseen examples, actual operator
measurement and independent review. Those are NOT_RUN today.

Contest completion: real Agent-Native actions and model loop; CSV import; shared
editable card preview; proposed copy with human acceptance; genuine PDF export;
proven repeated workflow benefit; accessible real Clips demo; complete submission.
The print slice alone does not satisfy those gates. No CMYK/PDF-X or printer
acceptance claim is made for a browser-generated PDF.
