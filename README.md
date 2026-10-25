# ProofDeck

An offline working sketch for editing localized tabletop cards in their actual
layout. The example game, copy proposals and vector artwork were prepared for
this experiment. It is not yet an Agent-Native application or an autonomous AI demo.

Open [the interactive sketch](artifacts/preview.html) in a browser. Choose draft
or prepared edited copy, select a card and edit the wording. Checks update live.

Artifacts:

- [Edited workspace screenshot](artifacts/edited.png)
- [Six-card German PDF proof](artifacts/german-card-proof.pdf)
- [Actual probe results and limitations](artifacts/probe.json)
- [Research, competition strategy, MVP plan and completion criteria](STRATEGY.md)

Run the browser/PDF probe from this directory:

```sh
.venv/bin/python probe.py
```

To set up locally with Python 3.13 and `uv`:

```sh
UV_CACHE_DIR="$PWD/.cache" uv venv --python /usr/bin/python3 .venv
UV_CACHE_DIR="$PWD/.cache" uv pip install --python .venv/bin/python --no-deps -r requirements.lock
PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" .venv/bin/python -m playwright install chromium
```

The build currently embeds `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`;
its license is included in third_party and the generated HTML. A different
machine needs this font path or an explicit local equivalent. Clean-machine
installation has not been independently tested.

The PDF has nominal 63 × 88 mm pages after media-box normalization, extractable
text and unchanged 10 pt body copy. It is an RGB editorial proof, not a certified
PDF-X/CMYK production file. No physical print or linguistic usability study ran.
Mechanical equality does not imply unchanged game meaning: the retained
may/must counterexample demonstrates this limit.
