"""Replace a portrait's wall with a smooth one, keeping the figure's pixels (Arthur 2026-10-12: Seth's wall had a palm
shadow; on hover it grew with him, so the card read as a zoom while the others read as the person stepping closer).

    python tools/img/people_plainwall.py team-karasik     # 06-brand/people/cut/<key>.png rewritten (backup in cut/_bak/)

The figure is segmented on the final portrait (u2net_human_seg); the wall is rebuilt by normalized convolution of the
pixels outside it (a very wide blur that ignores the figure), which keeps the light falloff and drops the shadow detail.
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parents[2]
CUT = ROOT / '06-brand/people/cut'
key = sys.argv[1]
src = CUT / f'{key}.png'
im = Image.open(src).convert('RGB')
fig = remove(im, session=new_session('u2net_human_seg')).split()[3]
fig = fig.point(lambda v: 255 if v > 110 else 0).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
wall_w = ImageChops.invert(fig.point(lambda v: 255 if v > 20 else 0))        # 255 where the wall is
R = 90
num = ImageChops.multiply(im, Image.merge('RGB', [wall_w] * 3)).filter(ImageFilter.GaussianBlur(R))
den = wall_w.filter(ImageFilter.GaussianBlur(R))
px_n, px_d = num.load(), den.load()
wall = Image.new('RGB', im.size)
pw = wall.load()
for y in range(im.height):
    for x in range(im.width):
        d = max(px_d[x, y], 1) / 255
        pw[x, y] = tuple(min(255, round(c / d)) for c in px_n[x, y])
out = Image.composite(im, wall, fig)
out.save(src)
print(key, 'wall rebuilt; figure kept')
