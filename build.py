"""Build the self-contained, offline proofing sketch; not a live AI app."""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build():
    template = (ROOT / "ui.html").read_text()
    font = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf").read_bytes()
    document = template.replace("__FONT__", base64.b64encode(font).decode())
    document = document.replace("__DATA__", (ROOT / "data/cards.json").read_text().replace("<", "\\u003c"))
    notice = (ROOT / "third_party/DejaVu-font-license.txt").read_text()
    document = "<!-- Embedded DejaVu font license\n" + notice + "\n-->\n" + document
    (ROOT / "artifacts" / "preview.html").write_text(document)


if __name__ == "__main__":
    build()
