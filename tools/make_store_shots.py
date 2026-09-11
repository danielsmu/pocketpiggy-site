#!/usr/bin/env python3
"""Composite raw simulator captures into App Store marketing screenshots.

One house style across every platform so the set reads as a single campaign:
the app's own Baloo 2 display face, a cream-to-blush wash, a deep navy
headline, the device screen floated on a soft shadow, and a muted subhead.
Headlines lead with the benefit and carry the words a parent would search.

Raw captures are expected in /tmp/ss/raw (see the capture steps in the
README). Finished sets are written to the Desktop, sized exactly as App
Store Connect requires.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = "/Users/danielmilner/Coding Projects/kids-budget/Kids Budget/Resources/Fonts/Baloo2-Variable.ttf"
OUT = "/Users/danielmilner/Desktop/PocketPiggy-AppStore"
RAW = "/tmp/ss/raw"

INK = (27, 31, 59)
MUTED = (104, 111, 138)
CREAM = (253, 249, 243)
BLUSH = (243, 231, 240)


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def wash(size, top=CREAM, bottom=BLUSH):
    w, h = size
    base = Image.new("RGB", (1, h))
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(1, h - 1)
        d.point((0, y), fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return base.resize(size, Image.BILINEAR)


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=radius, fill=255)
    out = im.convert("RGB").copy()
    out.putalpha(mask)
    return out


def shadow(canvas, box, radius, blur=60, opacity=70, offset=(0, 26)):
    x, y, w, h = box
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(
        [x + offset[0], y + offset[1], x + w + offset[0], y + h + offset[1]],
        radius=radius, fill=(27, 31, 59, opacity))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def wrap(draw, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def centered_text(canvas, lines, f, y, color, spacing=1.12):
    d = ImageDraw.Draw(canvas)
    lh = int(f.size * spacing)
    for i, line in enumerate(lines):
        w = d.textlength(line, font=f)
        d.text(((canvas.size[0] - w) / 2, y + i * lh), line, font=f, fill=color)
    return y + len(lines) * lh


def make(out_name, size, screen_path, headline, subhead,
         head_size, sub_size, screen_scale=0.78, top_pad=0.055,
         radius=56, landscape_screen=False):
    W, H = size
    canvas = wash(size).convert("RGBA")
    d = ImageDraw.Draw(canvas)

    hf, sf = font(head_size, 800), font(sub_size, 600)
    head_lines = wrap(d, headline, hf, W * 0.86)
    y = int(H * top_pad)
    y = centered_text(canvas, head_lines, hf, y, INK)
    if subhead:
        y += int(head_size * 0.22)
        sub_lines = wrap(d, subhead, sf, W * 0.80)
        y = centered_text(canvas, sub_lines, sf, y, MUTED)

    shot = Image.open(screen_path).convert("RGB")
    if landscape_screen and shot.size[1] > shot.size[0]:
        shot = shot.rotate(-90, expand=True)

    avail_h = H - y - int(H * 0.05)
    sw = int(W * screen_scale)
    sh = int(sw * shot.size[1] / shot.size[0])
    if sh > avail_h:
        sh = avail_h
        sw = int(sh * shot.size[0] / shot.size[1])
    shot = shot.resize((sw, sh), Image.LANCZOS)

    x = (W - sw) // 2
    yy = y + int(H * 0.035)
    shadow(canvas, (x, yy, sw, sh), radius)
    canvas.alpha_composite(rounded(shot, radius), (x, yy))

    os.makedirs(os.path.dirname(out_name), exist_ok=True)
    canvas.convert("RGB").save(out_name, quality=95)
    print("  ", os.path.basename(out_name), canvas.size)


IPHONE = (1320, 2868)
IPAD = (2064, 2752)
TV = (1920, 1080)
WATCH = (410, 502)

phone = [
    ("01-board.jpg", "board.png", "Chores that actually pay",
     "Every kid and every chore, on one screen"),
    ("02-payday.jpg", "kiddetail.png", "Spend. Save. Give.",
     "Split every dollar and fill a savings goal"),
    ("03-kidmode.jpg", "kidmode.png", "Kids check off their own",
     "A locked Kid Mode, read aloud for pre-readers"),
    ("04-picker.jpg", "kidpicker.png", "One tap and it is theirs",
     "Rotating chores, allowance and Pay Day"),
]

if __name__ == "__main__":
    print("iPhone 6.9 inch")
    for name, src, head, sub in phone:
        make(f"{OUT}/iPhone-6.9/{name}", IPHONE, f"{RAW}/{src}", head, sub,
             head_size=100, sub_size=46, screen_scale=0.82, radius=58)

    print("iPad 13 inch")
    ipad = [
        ("01-board.jpg", "ipad.png", "The family board, on iPad",
         "Chores on the left, a kid's money on the right"),
        ("02-payday.jpg", "ipad.png", "Pay Day, every week",
         "Set the day. The app handles the rest"),
    ]
    for name, src, head, sub in ipad:
        make(f"{OUT}/iPad-13/{name}", IPAD, f"{RAW}/{src}", head, sub,
             head_size=118, sub_size=58, screen_scale=0.76, radius=44)

    print("Apple TV")
    make(f"{OUT}/AppleTV/01-board.jpg", TV, f"{RAW}/tv.png",
         "The chore chart on your wall", "Everyone sees the week at a glance",
         head_size=74, sub_size=36, screen_scale=0.58, top_pad=0.07, radius=24)

    print("Apple Watch")
    make(f"{OUT}/AppleWatch/01-today.jpg", WATCH, f"{RAW}/watch.png",
         "Chores on your wrist", "",
         head_size=30, sub_size=18, screen_scale=0.60, top_pad=0.06, radius=14)

    print("\nWritten to", OUT)
