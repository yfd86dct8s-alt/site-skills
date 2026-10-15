# Digit centre vs disc centre in a 3x screenshot of one numbered circle (tools/circle-center.mjs). Prints "dy dx" in CSS px.
import sys
from collections import Counter
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); w, h = im.size
bg = im.getpixel((0, 0))
near = lambda p, q, t: sum(abs(a - b) for a, b in zip(p, q)) <= t
disc = [c for c, _ in Counter(im.getdata() if not hasattr(im, "get_flattened_data") else im.get_flattened_data()).most_common() if not near(c, bg, 60)][0]
pts = [(x, y) for y in range(h) for x in range(w) if near(im.getpixel((x, y)), disc, 40)]
x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts); y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2
ink = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if (x - cx) ** 2 + (y - cy) ** 2 < (r * 0.8) ** 2 and not near(im.getpixel((x, y)), disc, 120)]
ix = (min(p[0] for p in ink) + max(p[0] for p in ink)) / 2; iy = (min(p[1] for p in ink) + max(p[1] for p in ink)) / 2
print(round((iy - cy) / 3, 2), round((ix - cx) / 3, 2))
