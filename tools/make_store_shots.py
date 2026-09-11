#!/usr/bin/env python3
"""App Store screenshots for Pocket Piggy.

Art direction, deliberately not "caption on white":

* Alternating panels. Odd shots sit on deep navy with cream type, even
  shots on warm cream with navy type. Scrolled in the App Store the set
  reads with a rhythm instead of a flat wall.
* A colour wash bleeds from behind the device in that shot's accent, so
  each panel owns a hue without leaving the palette.
* Devices wear a real bezel and sit lower in frame, cropped at the
  bottom edge, which is what every top-grossing app does: the screen
  reads as a physical object continuing past the panel.
* Headline is two lines maximum at a hard size, with a short kicker
  above it in the accent colour. Kicker carries the keyword, headline
  carries the benefit.
* First two shots are the ones that must work as thumbnails, so their
  headlines are the shortest in the set.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = "/Users/danielmilner/Coding Projects/kids-budget/Kids Budget/Resources/Fonts/Baloo2-Variable.ttf"
OUT = "/Users/danielmilner/Desktop/PocketPiggy-AppStore"
RAW = "/tmp/ss/raw"

INK = (23, 27, 52)
CREAM = (253, 249, 243)
CREAM_DIM = (198, 200, 216)
INK_DIM = (116, 122, 150)
ACCENTS = {
    "purple": (139, 92, 246),
    "coral": (250, 100, 100),
    "blue": (71, 143, 237),
    "green": (84, 199, 118),
    "gold": (240, 176, 60),
}


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def panel(size, dark, accent):
    """Background: flat base plus a soft accent bloom behind the device."""
    W, H = size
    base = Image.new("RGB", size, INK if dark else CREAM)
    bloom = Image.new("RGB", size, INK if dark else CREAM)
    d = ImageDraw.Draw(bloom)
    r = int(W * 0.85)
    cx, cy = W // 2, int(H * 0.60)
    mix = 0.40 if dark else 0.30
    col = tuple(int(base.getpixel((0, 0))[i] + (accent[i] - base.getpixel((0, 0))[i]) * mix) for i in range(3))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    bloom = bloom.filter(ImageFilter.GaussianBlur(int(W * 0.16)))
    return Image.blend(base, bloom, 0.85).convert("RGBA")


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=radius, fill=255)
    out = im.convert("RGB").copy()
    out.putalpha(mask)
    return out


def wrap(draw, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def make(path, size, screen, kicker, headline, accent_name="purple", dark=False,
         head_pt=None, kick_pt=None, bezel=None, radius=None, screen_w=0.74,
         device_top=0.30, landscape=False):
    W, H = size
    accent = ACCENTS[accent_name]
    canvas = panel(size, dark, accent)
    d = ImageDraw.Draw(canvas)

    head_pt = head_pt or int(W * 0.082)
    kick_pt = kick_pt or int(head_pt * 0.42)
    radius = radius if radius is not None else int(W * 0.045)
    bezel = bezel if bezel is not None else max(6, int(W * 0.008))

    hf, kf = font(head_pt, 800), font(kick_pt, 700)
    head_col = CREAM if dark else INK
    kick_col = accent if not dark else tuple(min(255, c + 45) for c in accent)

    y = int(H * 0.062)
    kw = d.textlength(kicker, font=kf)
    d.text(((W - kw) / 2, y), kicker.upper(), font=kf, fill=kick_col)
    y += int(kick_pt * 1.7)

    for line in wrap(d, headline, hf, W * 0.88):
        lw = d.textlength(line, font=hf)
        d.text(((W - lw) / 2, y), line, font=hf, fill=head_col)
        y += int(head_pt * 1.06)

    shot = Image.open(f"{RAW}/{screen}").convert("RGB")
    if landscape and shot.size[1] > shot.size[0]:
        shot = shot.rotate(-90, expand=True)

    sw = int(W * screen_w)
    sh = int(sw * shot.size[1] / shot.size[0])
    shot = shot.resize((sw, sh), Image.LANCZOS)
    x = (W - sw) // 2
    yy = max(y + int(H * 0.03), int(H * device_top))

    # bezel + drop shadow, device bleeding off the bottom of the panel
    sha = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(sha).rounded_rectangle(
        [x - bezel, yy - bezel + 30, x + sw + bezel, yy + sh + bezel + 30],
        radius=radius + bezel, fill=(0, 0, 0, 110))
    canvas.alpha_composite(sha.filter(ImageFilter.GaussianBlur(int(W * 0.035))))

    frame = Image.new("RGBA", (sw + bezel * 2, sh + bezel * 2), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle(
        [0, 0, sw + bezel * 2 - 1, sh + bezel * 2 - 1], radius=radius + bezel, fill=(16, 18, 34, 255))
    canvas.alpha_composite(frame, (x - bezel, yy - bezel))
    canvas.alpha_composite(rounded(shot, radius), (x, yy))

    os.makedirs(os.path.dirname(path), exist_ok=True)
    canvas.convert("RGB").save(path, quality=95)
    print("  ", os.path.basename(path))


IPHONE, IPAD, TV, WATCH = (1320, 2868), (2064, 2752), (1920, 1080), (410, 502)

PHONE = [
    ("01-board.jpg", "board.png", "chore chart & allowance", "Chores that pay", "purple", True),
    ("02-payday.jpg", "payday.png", "pay day", "Pay Day, every week", "gold", False),
    ("03-buckets.jpg", "kiddetail.png", "spend · save · give", "Teach saving, not nagging", "coral", True),
    ("04-kidmode.jpg", "kidmode.png", "kid mode", "Kids do it themselves", "blue", False),
    ("05-rotate.jpg", "choreeditor.png", "rotating chores", "Whose turn? Settled.", "green", True),
    ("06-money.jpg", "money.png", "one family ledger", "Know what you owe", "purple", False),
    ("07-picker.jpg", "kidpicker.png", "built for siblings", "Every kid, their world", "coral", True),
]

IPAD_SET = [
    ("01-board.jpg", "ipadboard.png", "the family board", "Chores and money together", "purple", True),
    ("02-money.jpg", "ipadmoney.png", "spend · save · give", "Every balance at a glance", "coral", False),
    ("03-chores.jpg", "ipadchores.png", "rotating chores", "Set it once, it repeats", "green", True),
    ("04-settings.jpg", "ipadsettings.png", "pay day", "You pick the day and time", "gold", False),
]

if __name__ == "__main__":
    print("iPhone 6.9 inch")
    for name, src, kick, head, accent, dark in PHONE:
        make(f"{OUT}/iPhone-6.9/{name}", IPHONE, src, kick, head, accent, dark,
             screen_w=0.76, device_top=0.30)

    print("iPad 13 inch")
    for name, src, kick, head, accent, dark in IPAD_SET:
        make(f"{OUT}/iPad-13/{name}", IPAD, src, kick, head, accent, dark,
             head_pt=132, kick_pt=52, screen_w=0.70, device_top=0.26, radius=36)

    print("Apple TV")
    for name, src, kick, head, accent, dark in [
        ("01-board.jpg", "tv.png", "apple tv", "The chart on your wall", "purple", True),
        ("02-week.jpg", "tv.png", "the whole week", "Everyone sees the week", "blue", False)]:
        make(f"{OUT}/AppleTV/{name}", TV, src, kick, head, accent, dark,
             head_pt=86, kick_pt=34, screen_w=0.62, device_top=0.30, radius=18, bezel=8)

    print("Apple Watch")
    for name, kick, head, accent, dark in [
        ("01-today.jpg", "on your wrist", "Today's chores", "purple", True),
        ("02-payday.jpg", "pay day", "Counts down with you", "gold", False)]:
        make(f"{OUT}/AppleWatch/{name}", WATCH, "watch.png", kick, head, accent, dark,
             head_pt=34, kick_pt=15, screen_w=0.56, device_top=0.34, radius=12, bezel=3)

    print("\nWritten to", OUT)
