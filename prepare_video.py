"""Edit only real recorded frames; disclose shortened waiting and retain full cut."""
from pathlib import Path
import json
import subprocess
import imageio_ffmpeg

root = Path(__file__).resolve().parent
artifacts = root / "artifacts"
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
full = artifacts / "proofdeck-demo-full.mp4"
if not full.exists():
    subprocess.run([ffmpeg, "-y", "-i", str(artifacts / "proofdeck-demo.webm"), "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(full)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

captions = '''1
00:00:00,000 --> 00:00:04,200
ProofDeck: synthetic errors, real live AI.

2
00:00:04,200 --> 00:00:08,000
The agent reads the source and the actual layout. Waiting shortened.

3
00:00:08,000 --> 00:00:14,500
Compare the proposed wording. Keep the numbers, symbols and 10 pt type.

4
00:00:14,500 --> 00:00:22,000
Accept wording after review. Mechanical checks do not prove meaning.

5
00:00:22,000 --> 00:00:25,000
Approve an exact revision, then download its RGB PDF proof.

6
00:00:25,000 --> 00:00:28,600
Saved wording and revision history remain after reload.
'''
(artifacts / "demo-captions.srt").write_text(captions)
segments = [(12, 20), (38, 55), (63, 65.6)]
parts = [f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]" for i, (a, b) in enumerate(segments)]
parts.append("".join(f"[v{i}]" for i in range(len(segments))) + "concat=n=3:v=1:a=0[joined]")
parts.append("[joined]subtitles=artifacts/demo-captions.srt:force_style='FontName=DejaVu Sans,FontSize=11,BorderStyle=3,Outline=1,Shadow=0,MarginV=5'[out]")
command = [ffmpeg, "-y", "-i", str(full), "-filter_complex", ";".join(parts), "-map", "[out]", "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(artifacts / "proofdeck-demo.mp4")]
result = subprocess.run(command, cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
(artifacts / "video-edit.log").write_text(result.stderr)
assert result.returncode == 0, result.stderr[-2000:]
metadata = {"source": "proofdeck-demo-full.mp4", "source_kind": "Real Playwright browser recording, no mocked responses", "output": "proofdeck-demo.mp4", "source_segments_seconds": segments, "nominal_output_seconds": sum(b-a for a,b in segments), "edits": "Opening/loading and part of AI waiting removed; captions disclose shortened waiting. No response frames generated or replaced.", "audio": "None; English captions burned into video", "clips_submission": "NOT_SUBMITTED"}
(artifacts / "video-edit.json").write_text(json.dumps(metadata, indent=2))
print(json.dumps(metadata, indent=2))
