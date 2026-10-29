import os
import subprocess
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "tiles")
HIRES = os.path.join(ROOT, "dev", "data", "hires")
PROXY = os.environ.get("PUBG_PROXY")

MAPS = {
    "erangel": "Erangel",
    "miramar": "Miramar",
    "taego": "Taego",
    "vikendi": "Vikendi",
    "deston": "Deston",
    "rondo": "Rondo",
    "sanhok": "Sanhok",
    "paramo": "Paramo",
    "karakin": "Karakin",
}

MAX_ZOOM = int(os.environ.get("MAX_ZOOM", "4"))
QUALITY = int(os.environ.get("QUALITY", "82"))


def fetch_hires(slug, name):
    os.makedirs(HIRES, exist_ok=True)
    path = os.path.join(HIRES, f"{slug}.png")
    if os.path.exists(path) and os.path.getsize(path) > 50 * 1024 * 1024:
        return path
    url = f"https://media.githubusercontent.com/media/pubg/api-assets/master/Assets/Maps/{name}_Main_High_Res.png"
    proxy_args = ["-x", PROXY] if PROXY else []
    for cmd in (
        ["curl", "-sL", *proxy_args, "--max-time", "900", "-o", path, url],
        ["curl", "-sL", "--max-time", "900", "--retry", "3", "-o", path, url],
        ["curl", "-sL", "--max-time", "900", "-o", path,
         f"https://ghfast.top/https://github.com/pubg/api-assets/raw/master/Assets/Maps/{name}_Main_High_Res.png"],
    ):
        subprocess.run(cmd, check=False)
        if os.path.exists(path) and os.path.getsize(path) > 50 * 1024 * 1024:
            return path
    raise RuntimeError(f"cannot download high-res for {slug}")


def generate(slug, src_path):
    img = Image.open(src_path).convert("RGB")
    side = img.width
    for z in range(MAX_ZOOM + 1):
        n = 2 ** z
        crop = side // n
        for tx in range(n):
            out_dir = os.path.join(OUT, slug, str(z), str(tx))
            os.makedirs(out_dir, exist_ok=True)
            for ty in range(n):
                tile = img.crop((tx * crop, ty * crop, (tx + 1) * crop, (ty + 1) * crop))
                tile = tile.resize((256, 256), Image.LANCZOS)
                tile.save(os.path.join(out_dir, f"{ty}.webp"), "WEBP", quality=QUALITY, method=6)
    print(f"{slug}: z0-{MAX_ZOOM} generated", flush=True)


if __name__ == "__main__":
    only = set(sys.argv[1:])
    for slug, name in MAPS.items():
        if only and slug not in only:
            continue
        try:
            generate(slug, fetch_hires(slug, name))
        except Exception as exc:
            print(f"{slug} FAILED: {exc}", flush=True)
