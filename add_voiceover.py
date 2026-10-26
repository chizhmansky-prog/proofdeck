"""Mix an existing narration into the real demo; preserve every video frame."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / "artifacts"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [FFMPEG, "-hide_banner", *args], capture_output=True, text=True, check=True
    )


def frame_digest(path: Path) -> dict:
    result = run("-v", "error", "-i", str(path), "-map", "0:v:0", "-f", "framemd5", "-")
    frames = [line for line in result.stdout.splitlines() if line and not line.startswith("#")]
    hashes = "\n".join(line.rsplit(",", 1)[-1].strip() for line in frames)
    return {"frames": len(frames), "decoded_frame_hashes_sha256": hashlib.sha256(hashes.encode()).hexdigest()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audio", type=Path, default=ARTIFACTS / "proofdeck-narration.mp3")
    parser.add_argument("--offset", type=float, default=0.6)
    args = parser.parse_args()
    source = ARTIFACTS / "proofdeck-demo.mp4"
    output = ARTIFACTS / "proofdeck-demo-voiced.mp4"
    reader = imageio_ffmpeg.read_frames(str(source))
    video = next(reader)
    reader.close()
    duration = video["duration"]
    pcm = subprocess.run(
        [FFMPEG, "-v", "error", "-i", str(args.audio), "-ac", "1", "-ar", "48000", "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    narration_duration = len(pcm) / 2 / 48000
    assert args.offset >= 0 and args.offset + narration_duration <= duration, "The complete narration must fit inside the clip"
    analysis = run("-i", str(args.audio), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-")
    measured, _ = json.JSONDecoder().raw_decode(analysis.stderr[analysis.stderr.rfind("{"):])
    audio_filter = (
        "loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:"
        f"measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
        f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:"
        f"offset={measured['target_offset']},"
        f"adelay={round(args.offset * 1000)}:all=1,apad,atrim=duration={duration}"
    )
    run("-y", "-i", str(source), "-i", str(args.audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", audio_filter, "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-t", str(duration), "-movflags", "+faststart", str(output))
    original_frames = frame_digest(source)
    finished_frames = frame_digest(output)
    assert original_frames == finished_frames, "Narration mix altered the recorded video"
    audio_check = run("-i", str(output), "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-")
    volume = dict(re.findall(r"(mean_volume|max_volume):\s*(-?[\d.]+) dB", audio_check.stderr))
    assert float(volume["mean_volume"]) > -40, "Final audio is effectively silent"
    assert float(volume["max_volume"]) < 0, "Final audio clips"
    report = {
        "source": source.name,
        "audio": args.audio.name,
        "output": output.name,
        "duration_seconds": duration,
        "audio_offset_seconds": args.offset,
        "narration_duration_seconds": narration_duration,
        "complete_narration_fits": True,
        "narration_speed_changed": False,
        "original_video": original_frames,
        "finished_video": finished_frames,
        "video_frames_identical": True,
        "audio_codec": "AAC",
        "audio_sample_rate": 48000,
        "normalization_target_lufs": -16,
        "normalization_peak_target_dbtp": -1.5,
        "volume_db": volume,
        "input_loudness": measured,
        "mp4_bytes": output.stat().st_size,
        "mp4_sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "checks": {"full_decode": "PASS", "video_frames_unchanged": "PASS", "audio_present": "PASS", "no_sample_clipping": "PASS", "complete_narration_fits": "PASS"},
    }
    (ARTIFACTS / "voiceover-verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
