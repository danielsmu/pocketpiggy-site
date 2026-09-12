import sys
sys.path.insert(0, "/Users/danielmilner/Coding Projects/pocketpiggy-site/tools")
from make_store_shots import make, IPAD, TV, IPHONE, IPAD_SET, PHONE

print("iPad 13 inch (all 4)")
for name, src, kick, head, accent, dark in IPAD_SET:
    make(f"/Users/danielmilner/Desktop/PocketPiggy-AppStore/iPad-13/{name}", IPAD, src, kick, head, accent, dark,
         head_pt=168, kick_pt=56, screen_w=0.78, device_top=0.20, radius=36)

print("Apple TV (both)")
for name, src, kick, head, accent, dark in [
    ("01-board.jpg", "tv.png", "apple tv", "The chart on your wall", "purple", True),
    ("02-week.jpg", "tvkiddetail.png", "tap in on one kid", "Their own progress too", "blue", False)]:
    make(f"/Users/danielmilner/Desktop/PocketPiggy-AppStore/AppleTV/{name}", TV, src, kick, head, accent, dark,
         head_pt=104, kick_pt=38, screen_w=0.66, device_top=0.26, radius=18, bezel=8)

print("iPhone 6.9 (01, 02 only -- 03-07 untouched, their raws are stale)")
for name, src, kick, head, accent, dark in PHONE:
    if name not in ("01-board.jpg", "02-payday.jpg"):
        continue
    make(f"/Users/danielmilner/Desktop/PocketPiggy-AppStore/iPhone-6.9/{name}", IPHONE, src, kick, head, accent, dark,
         screen_w=0.84, device_top=0.21)

print("\nDone.")
