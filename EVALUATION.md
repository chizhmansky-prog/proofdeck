# Comparative evaluation — not yet executed

The product is built. Its advantage over a strong assistant plus existing tools
still needs a fair user study; the engineering checks do not substitute for one.

Hypothesis: for repeated localization edits, ProofDeck reduces total editor work
by keeping current text, actual layout, proposals and proof revision together.

Compare ProofDeck with (a) the same configured Codex model plus CSV/browser/PDF
tools, and (b) an existing card editor plus its normal AI/QA workflow. Do not
deny the baseline tools simply because it lacks our interface. Document setup,
licenses and actual supported features rather than comparing marketing claims.

Use at least two actual localization editors and counterbalanced task order.
An independent task author supplies unseen decks, including optional/mandatory
rules, repeated symbols, long wording and cases requiring abstention. Keep the
existing synthetic fixtures as development examples, never call them holdout.

Measure full editor time, setup/review time, interventions, final rendering,
numbers/tokens/terminology defects and semantic errors. Keep type size and
export requirements identical. Judge semantic correctness blind to the tool.
Record model identity, settings, task bytes/hashes and usage where available.

Predeclared bar for a time-saving claim: no increase in final semantic or
mechanical defects, plus at least 25% lower median total editor time on repeated
tasks. This is a target, not an observed result. If it misses, report the miss
and revise the workflow; do not tune on the holdout or invent a new baseline.

Independent rerun, actual editor study, paid competitor execution and quantitative
improvement are currently **NOT_RUN**. No one has been contacted on the user's
behalf. Source research and working software do not prove willingness to pay or
the probability of winning a prize.
