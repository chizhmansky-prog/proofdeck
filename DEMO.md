# Real product demo

Target length: about 2 minutes; this is an editorial choice, not an event limit.
The required public recording must be made with Clips in the participant's
account. Local screen recordings are preparation and evidence.

1. Open ProofDeck with the original, synthetic Amber Atlas deck. Say that errors
   were seeded for the demonstration. Keep source and actual 63 × 88 mm card
   visible.
2. Select Windrunner: the German text overflows at fixed 10 pt. Ask the live
   agent for a shorter proposal. Show the actual action progress and result.
   Do not replace the live wait with a fabricated response.
3. Show original and proposal. Toggle its card preview. The agent reads rules,
   stages wording and measures the rendered proposal. The editor accepts it.
4. Show a number/symbol finding on another card. Correct it through the same
   agent workflow or editor, and show that approval is unavailable until checks
   clear. Explain that meaning still needs a person.
5. Approve the reviewed revision and download the actual PDF. Open it and show
   that it contains the accepted wording, with the same fixed dimensions/type.
6. Reload the saved deck and show its revision history.

Suggested narration:

"A good translation can still break a game card. ProofDeck keeps the language
and the layout together. Here the German wording exceeds its real copy area.
I ask the agent to shorten it, while keeping the numbers, symbols and game
rules. It saves a proposal and checks the actual rendered card. I can compare,
preview and accept the wording. Mechanical checks catch layout and consistency
problems; I still review the meaning. The PDF is tied to that exact reviewed
revision. If the words change, approval expires. One saved deck, one shared
action surface, and a proof the editor can inspect."

Do not promise automatic semantic equivalence, production print certification,
proven time savings, or a prize result.

Delivered local recordings: `artifacts/proofdeck-demo.mp4` is a 27.6-second
captioned cut; `artifacts/proofdeck-demo-full.mp4` retains the full 65.6-second
recording. Opening/loading and part of the live wait are cut, with disclosure.
No model response is fabricated. Both original cuts are silent.

`artifacts/proofdeck-demo-voiced.mp4` adds English ElevenLabs narration to the
27.6-second cut. The exact script is in `artifacts/demo-narration.txt`; the
chosen Bella / eleven_v4 take and an automatic Scribe transcript are recorded
in `artifacts/narration-provenance.json`. Two takes were generated; the take
with a verified matching transcript is used. Speech is not sped up. The mix
starts 0.6 seconds into the video, is normalized to a -16 LUFS target, and
retains every original video frame. `artifacts/voiceover-verification.json`
records actual frame hashes and decoded audio checks. Human listening review
was not performed. Rebuild with `.venv/bin/python add_voiceover.py`.

These local files are preparation for the mandatory public Clips step.
