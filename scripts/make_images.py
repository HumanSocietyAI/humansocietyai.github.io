#!/usr/bin/env python3
"""Generates the decorative SVG images (news cards, favicon) in the University of Pannonia palette."""
import math, pathlib, random
ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"; IMG.mkdir(parents=True, exist_ok=True)

def network_svg(seed, w=800, h=450, label="", sub="", bg=("#0a7f88", "#17344f")):
    rnd = random.Random(seed)
    pts = [(rnd.uniform(0, w), rnd.uniform(0, h), rnd.random()) for _ in range(46)]
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">',
           f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{bg[0]}"/><stop offset="1" stop-color="{bg[1]}"/></linearGradient></defs>',
           f'<rect width="{w}" height="{h}" fill="url(#g)"/>']
    for i, (x1, y1, k1) in enumerate(pts):
        for x2, y2, k2 in pts[i + 1:]:
            d = math.hypot(x1 - x2, y1 - y2)
            if d < 150:
                mixed = (0.62 <= k1 < 0.86) != (0.62 <= k2 < 0.86)
                col = "97,206,212" if mixed else "255,255,255"
                out.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="rgba({col},{0.5*(1-d/150):.2f})" stroke-width="1.2"/>')
    for x, y, k in pts:
        if k < 0.62: out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="4" fill="#fff" fill-opacity=".9"/>')
        elif k < 0.86: out.append(f'<rect x="{x-5:.0f}" y="{y-5:.0f}" width="10" height="10" fill="#61ced4"/>')
        else: out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" fill="none" stroke="#fff" stroke-width="2.4"/>')
    if label:
        out.append(f'<rect x="0" y="{h-150}" width="{w}" height="150" fill="rgba(17,40,60,.55)"/>')
        out.append(f'<text x="40" y="{h-80}" font-family="Raleway, Arial, sans-serif" font-weight="900" font-size="64" fill="#fff">{label}</text>')
        if sub: out.append(f'<text x="42" y="{h-38}" font-family="Raleway, Arial, sans-serif" font-weight="600" font-size="26" fill="#bdf3f6">{sub}</text>')
    out.append("</svg>")
    return "\n".join(out)

(IMG / "news-launch.svg").write_text(network_svg(7, label="Launch", sub="A new cross-faculty network"), encoding="utf-8")
(IMG / "news-workshop.svg").write_text(network_svg(11, label="11 December", sub="Founding workshop · hybrid", bg=("#275882", "#1b3f5f")), encoding="utf-8")
(IMG / "og-base.svg").write_text(network_svg(3, 1200, 630), encoding="utf-8")

# favicon: official crest (white) on PE blue
crest = (ROOT / "assets" / "logo" / "pe-crest-white.svg").read_text(encoding="utf-8")
inner = crest[crest.index(">", crest.index("<svg")) + 1: crest.rindex("</svg>")]
vb = crest.split('viewBox="')[1].split('"')[0].split()
cw, ch = float(vb[2]), float(vb[3]); s = 52 / max(cw, ch)
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#275882"/>'
       f'<g transform="translate({(64-cw*s)/2:.2f},{(64-ch*s)/2:.2f}) scale({s:.4f})">{inner}</g></svg>')
(IMG / "favicon.svg").write_text(fav, encoding="utf-8")
print("images written")
