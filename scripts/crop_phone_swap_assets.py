#!/usr/bin/env python3
"""Trim and align PhoneSwap assets. Output: public/images/phones/cropped/"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IN_DIR = ROOT / "public/images/phones"
OUT_DIR = IN_DIR / "cropped"
PAD = 12
THRESHOLD = 14


def content_bounds(im: Image.Image) -> tuple[int, int, int, int]:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 8 and (r > THRESHOLD or g > THRESHOLD or b > THRESHOLD):
                found = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if not found:
        raise ValueError("empty image")
    return (
        max(0, minx - PAD),
        max(0, miny - PAD),
        min(w - 1, maxx + PAD),
        min(h - 1, maxy + PAD),
    )


def anchor_point(im: Image.Image) -> tuple[int, int]:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    sum_x = 0
    count = 0
    max_y = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 8 and (r > THRESHOLD or g > THRESHOLD or b > THRESHOLD):
                sum_x += x
                count += 1
                max_y = max(max_y, y)
    return round(sum_x / count), max_y


def align_pair(front_name: str, back_name: str) -> dict:
    """Anchor front/back on a shared bottom-center; canvas fits front (back may extend)."""
    front_raw = Image.open(IN_DIR / front_name)
    back_raw = Image.open(IN_DIR / back_name)
    front = front_raw.crop(content_bounds(front_raw))
    back = back_raw.crop(content_bounds(back_raw))
    fa = anchor_point(front)
    ba = anchor_point(back)

    canvas_w = front.width + PAD * 2
    canvas_h = max(front.height, back.height) + PAD * 2
    anchor_x = canvas_w // 2
    anchor_y = canvas_h - PAD

    def place(source: Image.Image, source_anchor: tuple[int, int]) -> Image.Image:
        canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        left = anchor_x - source_anchor[0]
        top = anchor_y - source_anchor[1]
        canvas.paste(source, (left, top), source)
        return canvas

    front_out = place(front, fa)
    back_out = place(back, ba)

    # Extend canvas if angled back bleeds past the right edge.
    bleed = back_out.getbbox()
    if bleed and bleed[2] + PAD > canvas_w:
        new_w = bleed[2] + PAD
        for label, img in (("front", front_out), ("back", back_out)):
            extended = Image.new("RGBA", (new_w, canvas_h), (0, 0, 0, 0))
            extended.paste(img, (0, 0), img)
            if label == "front":
                front_out = extended
            else:
                back_out = extended
        canvas_w = new_w

    return {
        "front": front_out,
        "back": back_out,
        "meta": {
            "canvasW": canvas_w,
            "canvasH": canvas_h,
            "aspect": round(canvas_w / canvas_h, 4),
        },
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta: dict = {}
    pairs = [
        ("pixelFront.png", "pixelBack.png"),
        ("iphoneFront.png", "iphoneBack.png"),
    ]
    for front_name, back_name in pairs:
        key = front_name.replace("Front.png", "").replace("Back.png", "")
        result = align_pair(front_name, back_name)
        result["front"].save(OUT_DIR / front_name)
        result["back"].save(OUT_DIR / back_name)
        meta[key] = result["meta"]
        print(f"{key}: {result['meta']['canvasW']}x{result['meta']['canvasH']}")

    (OUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
