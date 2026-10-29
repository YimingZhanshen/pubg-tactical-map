# Generates public/og-cover.jpg (1200x630) from local map tiles.
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TILES = os.path.join(ROOT, "public", "tiles", "erangel", "4")
OUT = os.path.join(ROOT, "public", "og-cover.jpg")

# 4x4 mosaic around Pochinki (sharp 1024px base)
mosaic = Image.new("RGB", (1024, 1024))
for j, x in enumerate(range(7, 11)):
    for i, y in enumerate(range(7, 11)):
        tile = Image.open(os.path.join(TILES, str(x), f"{y}.webp")).convert("RGB")
        mosaic.paste(tile, (j * 256, i * 256))

canvas = mosaic.resize((1200, 1200), Image.LANCZOS).crop((0, 285, 1200, 915))

# dim + left gradient
shade = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
sd = ImageDraw.Draw(shade)
for x in range(canvas.width):
    alpha = int(210 * max(0.0, 1 - x / 980))
    sd.line([(x, 0), (x, canvas.height)], fill=(6, 9, 8, alpha))
canvas = Image.alpha_composite(canvas.convert("RGBA"), shade)
draw = ImageDraw.Draw(canvas)

font_dir = "C:/Windows/Fonts"
title = ImageFont.truetype(os.path.join(font_dir, "msyhbd.ttc"), 74)
sub = ImageFont.truetype(os.path.join(font_dir, "msyh.ttc"), 30)
small = ImageFont.truetype(os.path.join(font_dir, "msyh.ttc"), 21)
hud = ImageFont.truetype(os.path.join(font_dir, "consola.ttf"), 20)

accent = (242, 169, 0)
draw.rectangle((80, 176, 92, 300), fill=accent)
draw.text((120, 168), "PUBG 战术地图", font=title, fill=(238, 242, 239))
draw.text((122, 268), "迫击炮测距 · 密室 / 载具点位", font=sub, fill=(200, 210, 204))
draw.text((122, 330), "9 张官方高清地图 · 100m 网格 · A/B 双点测距", font=small, fill=(150, 162, 154))
draw.text((122, 520), "MORTAR RANGE 121–700 m", font=hud, fill=accent)
draw.text((122, 552), "pubg tactical map", font=hud, fill=(110, 122, 114))

canvas.convert("RGB").save(OUT, "JPEG", quality=86, optimize=True)
print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")
