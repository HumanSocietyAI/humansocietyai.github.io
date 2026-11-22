#!/usr/bin/env python3
"""Pre-render step: turns data/*.yml into HTML fragments and JSON used by the pages.

Run automatically by Quarto (see `pre-render` in _quarto.yml) or manually:
    python3 scripts/build_data.py

Outputs
  _generated/people-groups.md        member cards grouped by research line (People page)
  _generated/line-<id>.md            member cards for one research line (research pages)
  _generated/stats.md                key-figure strip (home page)
  _generated/lines-cards.md          research-line cards (home page, research overview)
  _generated/coordinator.md          coordinator card (contact page)
  assets/data/network.json             nodes and links for the interactive member–line graph
"""
from __future__ import annotations

import html
import json
import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
GEN = ROOT / "_generated"
DATA = ROOT / "assets" / "data"

FACULTY_SHORT = {
    "Faculty of Business and Economics": "Business & Economics",
    "Faculty of Engineering": "Engineering",
    "Faculty of Humanities": "Humanities",
    "Faculty of Information Technology": "Information Technology",
    "University Centre for Circular Economy, Nagykanizsa": "Nagykanizsa Centre",
    "University of Pannonia": "University-level unit",
}


def esc(s: str | None) -> str:
    return html.escape(s or "", quote=True)


def load():
    lines = yaml.safe_load((ROOT / "data" / "lines.yml").read_text(encoding="utf-8"))
    members = yaml.safe_load((ROOT / "data" / "members.yml").read_text(encoding="utf-8"))
    line_ids = {l["id"] for l in lines}
    seen = set()
    for m in members:
        if m["id"] in seen:
            sys.exit(f"duplicate member id: {m['id']}")
        seen.add(m["id"])
        bad = set(m.get("lines", [])) - line_ids
        if bad:
            sys.exit(f"{m['id']}: unknown research line(s) {bad}")
    members.sort(key=lambda m: (m["family"].casefold(), m["given"].casefold()))
    return lines, members


def full_name(m) -> str:
    return f"{m['given']} {m['family']}"


def initials(m) -> str:
    return (m["given"][0] + m["family"][0]).upper()


def faculty_label(m) -> str:
    if m.get("affiliation"):
        return "External"
    return FACULTY_SHORT.get(m.get("faculty", ""), m.get("faculty", ""))


def unit_line(m) -> str:
    if m.get("affiliation"):
        return m["affiliation"]
    parts = [m.get("department"), m.get("unit"), m.get("faculty")]
    return " · ".join(p for p in parts if p)


def mail_attrs(m) -> str:
    e = m.get("email") or {}
    if not e:
        return ""
    # reversed strings; assembled by assets/js/site.js on the visitor's browser
    return f'data-u="{esc(e["user"][::-1])}" data-d="{esc(e["domain"][::-1])}"'


ICON = {
    "mail": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 6 9 7 9-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
}


def links_html(m, lines_by_id) -> str:
    items = []
    if m.get("email"):
        items.append(f'<li><a class="js-mail mc-link" href="#" {mail_attrs(m)} aria-label="Email {esc(full_name(m))}">Email</a></li>')
    if m.get("orcid"):
        items.append(f'<li><a class="mc-link" href="https://orcid.org/{esc(m["orcid"])}" rel="noopener">ORCID</a></li>')
    if m.get("scholar"):
        items.append(f'<li><a class="mc-link" href="https://scholar.google.com/citations?user={esc(m["scholar"])}" rel="noopener">Google Scholar</a></li>')
    if m.get("openalex"):
        items.append(f'<li><a class="mc-link" href="https://openalex.org/authors/{esc(m["openalex"])}" rel="noopener">OpenAlex</a></li>')
    if m.get("website"):
        items.append(f'<li><a class="mc-link" href="{esc(m["website"])}" rel="noopener">Website</a></li>')
    if m.get("university_url"):
        items.append(f'<li><a class="mc-link" href="{esc(m["university_url"])}" rel="noopener">University page</a></li>')
    return '<ul class="mc-links">' + "".join(items) + "</ul>"


def photo_html(m) -> str:
    mono = f'<span class="mc-mono" aria-hidden="true">{esc(initials(m))}</span>'
    if m.get("photo"):
        img = (f'<img src="{esc(m["photo"])}" alt="Portrait of {esc(full_name(m))}" loading="lazy" '
               f'decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">')
        return f'<div class="mc-photo">{mono}{img}</div>'
    return f'<div class="mc-photo">{mono}</div>'


def card(m, lines_by_id, highlight: str | None = None, compact: bool = False) -> str:
    pos = esc(m["position"])
    if m.get("role"):
        pos += f' <span class="mc-role">{esc(m["role"])}</span>'
    chips = []
    for lid in m.get("lines", []):
        l = lines_by_id[lid]
        cls = "mc-chip is-current" if lid == highlight else "mc-chip"
        chips.append(f'<li><a class="{cls}" href="/research/{l["slug"]}.html">{esc(l["short"])}</a></li>')
    anchor = f' id="m-{esc(m["id"])}"' if not compact and highlight is None else ""
    return (
        f'<article class="member-card" data-member="{esc(m["id"])}" data-faculty="{esc(faculty_label(m))}"{anchor}>'
        f'{photo_html(m)}'
        f'<div class="mc-body">'
        f'<h3 class="mc-name">{esc(full_name(m))}</h3>'
        f'<p class="mc-pos">{pos}</p>'
        f'<p class="mc-unit">{esc(unit_line(m))}</p>'
        f'<p class="mc-bio">{esc(m["bio"])}</p>'
        f'<ul class="mc-chips" aria-label="Research lines">{"".join(chips)}</ul>'
        f'{links_html(m, lines_by_id)}'
        f'</div></article>'
    )


def write_fragment(name: str, html_text: str) -> None:
    """Write an HTML fragment wrapped in a raw-HTML fence so Quarto passes it through untouched."""
    (GEN / name).write_text("```{=html}\n" + html_text + "\n```\n", encoding="utf-8")


def build():
    lines, members = load()
    lines_by_id = {l["id"]: l for l in lines}
    GEN.mkdir(exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)

    # People page: grouped by research line; a member appears under every line they belong to
    out = ['<nav class="line-index" aria-label="Jump to research line"><ul>']
    for l in lines:
        n = sum(1 for m in members if l["id"] in m["lines"])
        out.append(f'<li><a href="#line-{l["id"]}"><span class="li-num">{l["num"]}</span> {esc(l["short"])} <span class="li-count">{n}</span></a></li>')
    out.append("</ul></nav>")
    for l in lines:
        group = [m for m in members if l["id"] in m["lines"]]
        out.append(f'<section class="people-group" id="line-{l["id"]}" aria-labelledby="h-line-{l["id"]}">')
        out.append(f'<h2 class="pe-title" id="h-line-{l["id"]}"><span class="pg-num">{l["num"]}</span> {esc(l["short"])}</h2>')
        out.append(f'<p class="pg-sub"><a href="/research/{l["slug"]}.html">{esc(l["title"])}</a> · {len(group)} members</p>')
        out.append('<div class="member-grid">' + "".join(card(m, lines_by_id, highlight=l["id"]) for m in group) + "</div>")
        out.append("</section>")
    write_fragment("people-groups.md", "\n".join(out))

    # Research-line pages
    for l in lines:
        group = [m for m in members if l["id"] in m["lines"]]
        body = '<div class="member-grid">' + "".join(card(m, lines_by_id, highlight=l["id"]) for m in group) + "</div>"
        write_fragment(f"line-{l['id']}.md", body)

    # Key figures
    faculties = {m["faculty"] for m in members if m.get("faculty", "").startswith("Faculty")}
    campuses = {m["campus"] for m in members if m.get("campus") and m["campus"] != "External"}
    stats = [
        (len(members), "researchers"),
        (len(faculties), "faculties"),
        (len(campuses), "campuses"),
        (len(lines), "research lines"),
        (5, "doctoral schools"),
    ]
    s = ['<ul class="stat-strip" aria-label="The network in numbers">']
    for v, label in stats:
        s.append(f'<li><span class="stat-num">{v}</span><span class="stat-label">{label}</span></li>')
    s.append("</ul>")
    write_fragment("stats.md", "".join(s))

    # Research-line cards
    c = ['<div class="line-cards">']
    for l in lines:
        n = sum(1 for m in members if l["id"] in m["lines"])
        c.append(
            f'<a class="line-card" href="/research/{l["slug"]}.html">'
            f'<span class="lc-num">{l["num"]:02d}</span>'
            f'<span class="lc-short">{esc(l["short"])}</span>'
            f'<span class="lc-title">{esc(l["title"])}</span>'
            f'<span class="lc-summary">{esc(l["summary"])}</span>'
            f'<span class="lc-meta">{n} members <span aria-hidden="true">→</span></span>'
            f'</a>'
        )
    c.append("</div>")
    write_fragment("lines-cards.md", "".join(c))

    # Coordinator card
    coord = [m for m in members if m.get("role") == "Coordinator"]
    write_fragment("coordinator.md", '<div class="member-grid single">' + "".join(card(m, lines_by_id, compact=True) for m in coord) + "</div>")

    # Network graph data
    nodes = [{"id": f"L:{l['id']}", "type": "line", "label": l["short"], "num": l["num"],
              "url": f"/research/{l['slug']}.html"} for l in lines]
    links = []
    for m in members:
        nodes.append({"id": m["id"], "type": "member", "label": full_name(m),
                      "group": faculty_label(m), "position": m["position"]})
        for i, lid in enumerate(m["lines"]):
            links.append({"source": m["id"], "target": f"L:{lid}", "main": i == 0})
    (DATA / "network.json").write_text(json.dumps({"nodes": nodes, "links": links}, ensure_ascii=False, indent=1),
                                       encoding="utf-8")
    print(f"build_data: {len(members)} members, {len(lines)} lines, {len(links)} member–line links")


if __name__ == "__main__":
    build()
