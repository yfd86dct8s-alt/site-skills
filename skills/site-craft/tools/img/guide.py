"""Layout guide for an image-model call: an earlier photo, scaled and placed where the subject must land, on a canvas
of the target shape. The empty margins are filled by stretching the photo's edges and blurring them, so the model
reads them as "continue the scene here", not as content.

    python tools/img/guide.py SRC OUT --canvas 3168x1344 --scale 0.75 --at X,Y

--at is where the scaled photo's top-left corner goes on the canvas (pixels, may be negative or overflow).
Why: Nano Banana Pro ignored framing in words (2026-10-03: asked for a truck a quarter of the frame wide, got 46%).
A guide image fixes size and position the way a sketch does (IMAGE-PLAN.md, section 1).
"""
import argparse
from PIL import Image, ImageFilter


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--canvas', required=True)
    ap.add_argument('--scale', type=float, required=True)
    ap.add_argument('--at', required=True)
    ap.add_argument('--src-crop', help='x0,y0,x1,y1: use only this part of SRC')
    ap.add_argument('--sky-top', help='R,G,B: paint the top margin as a sky deepening to this colour at the top edge')
    a = ap.parse_args()
    cw, ch = map(int, a.canvas.lower().split('x'))
    ox, oy = map(int, a.at.split(','))
    src = Image.open(a.src).convert('RGB')
    if a.src_crop:
        src = src.crop(tuple(map(int, a.src_crop.split(','))))
    sw, sh = round(src.width * a.scale), round(src.height * a.scale)
    img = src.resize((sw, sh), Image.LANCZOS)

    # Edge-stretched backdrop: the photo stretched to cover the canvas around its placement, then blurred.
    left, top = max(0, ox), max(0, oy)
    right, bottom = min(cw, ox + sw), min(ch, oy + sh)
    canvas = Image.new('RGB', (cw, ch))
    # stretch whole photo to the canvas as a base (keeps colours in the right zones), heavy blur
    base = src.resize((cw, ch), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
    canvas.paste(base, (0, 0))
    # edge strips stretched outward, lighter blur, so each margin continues its neighbour
    if top > 0:
        strip = img.crop((0, 0, sw, 8)).resize((sw, top), Image.BILINEAR).filter(ImageFilter.GaussianBlur(12))
        canvas.paste(strip, (ox, 0))
    if bottom < ch:
        strip = img.crop((0, sh - 8, sw, sh)).resize((sw, ch - bottom), Image.BILINEAR).filter(ImageFilter.GaussianBlur(12))
        canvas.paste(strip, (ox, bottom))
    if left > 0:
        strip = img.crop((0, 0, 8, sh)).resize((left, sh), Image.BILINEAR).filter(ImageFilter.GaussianBlur(12))
        canvas.paste(strip, (0, oy))
    if right < cw:
        strip = img.crop((sw - 8, 0, sw, sh)).resize((cw - right, sh), Image.BILINEAR).filter(ImageFilter.GaussianBlur(12))
        canvas.paste(strip, (right, oy))
    # corners: the matching corner pixel region, stretched
    for (cx0, cy0, cx1, cy1, sx, sy) in [(0, 0, left, top, 0, 0), (right, 0, cw, top, sw - 8, 0),
                                          (0, bottom, left, ch, 0, sh - 8), (right, bottom, cw, ch, sw - 8, sh - 8)]:
        if cx1 > cx0 and cy1 > cy0:
            patch = img.crop((sx, sy, sx + 8, sy + 8)).resize((cx1 - cx0, cy1 - cy0), Image.BILINEAR).filter(ImageFilter.GaussianBlur(12))
            canvas.paste(patch, (cx0, cy0))
    if a.sky_top and top > 0:
        # a smooth vertical sky: the photo's own top colour at the seam, deepening to --sky-top at the canvas top
        import numpy as np
        seam = np.asarray(img.crop((0, 0, sw, 12))).reshape(-1, 3).mean(axis=0)
        deep = np.array(list(map(int, a.sky_top.split(','))), dtype=float)
        t = (np.arange(top) / max(1, top - 1))[:, None]          # 0 at the top edge -> 1 at the seam
        t = t ** 0.8
        rows = deep * (1 - t) + seam * t
        sky = np.repeat(rows[:, None, :], cw, axis=1).clip(0, 255).astype('uint8')
        canvas.paste(Image.fromarray(sky), (0, 0))
    canvas.paste(img, (ox, oy))
    canvas.save(a.out)
    print(f'{a.out}: {cw}x{ch}, photo {sw}x{sh} at {ox},{oy}')


if __name__ == '__main__':
    main()
