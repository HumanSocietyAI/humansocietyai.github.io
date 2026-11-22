# Human- and Society-Centered AI Research Network – website

Source of **https://humansocietyai.github.io/**, the website of the Human- and Society-Centered AI Research Network of the University of Pannonia.

The site is a [Quarto](https://quarto.org) website. Its look follows the web design of the University of Pannonia (uni-pannon.hu): Raleway, IBM Plex Serif and Open Sans (self-hosted, no Google Fonts requests), the dark-blue top bar, the translucent teal header, the teal title highlight, wave dividers and offset blue frames. No cookies and no tracking.

## Branches

| Branch   | Content |
|----------|---------|
| `source` | Everything needed to build the site: Quarto pages, data, styles, scripts |
| `main`   | The rendered website only – GitHub Pages serves this branch as it is |

Never edit `main` by hand; it is overwritten on every publication.

## Repository layout (`source` branch)

```
_quarto.yml              site configuration, navigation
index.qmd                home page
research/                research overview and the nine research-line pages
approach.qmd, people.qmd, planned-studies.qmd, doctoral.qmd, publications.qmd,
news/ (index + posts/), events.qmd, activities.qmd, join.qmd, about.qmd, contact.qmd
data/members.yml         members – one entry per person (edit here)
data/lines.yml           the nine research lines
scripts/build_data.py    turns the data into member cards, research-line lists, key figures, graph data
scripts/make_images.py   decorative news images and the favicon
scripts/publish.sh       render and publish to the main branch
_partials/               top bar, footer, scripts (University-style frame)
assets/css/pe.scss       University of Pannonia theme
assets/js/               hero animation, member–line graph (D3), interactive diagrams, e-mail assembly
assets/fonts/, assets/vendor/   self-hosted fonts (SIL OFL 1.1) and D3 (ISC)
assets/logo/             official University of Pannonia logo files (2026)
```

## Common edits

**Add or correct a member** – edit `data/members.yml`. Copy an existing entry and change the fields; `lines` lists research-line ids (`minds`, `organizations`, `society`, `governance`, `trustworthy`, `industry`, `education`, `university`, `enterprises`). E-mail addresses are written without the “@” on purpose:

```yaml
- id: firstname-lastname
  given: Firstname
  family: Lastname
  position: Associate Professor
  faculty: Faculty of Engineering
  unit: Research Centre for Engineering Sciences
  department: Department of System Engineering
  campus: Veszprém
  email: {user: lastname.firstname, domain: mk.uni-pannon.hu}
  orcid: 0000-0000-0000-0000
  scholar: GoogleScholarUserId
  openalex: A0000000000
  university_url: https://...
  photo: https://...            # optional; a monogram is shown otherwise or if the image fails to load
  lines: [industry, trustworthy]  # first = main line
  bio: "About 40 words, third person."
```

The People page, the research-line pages, the key figures on the home page and the network graph update automatically.

**Add a news item** – create `news/posts/YYYY-MM-DD-short-title.qmd` (copy an existing post). The news list and RSS feed update automatically; add it to the home page’s news block in `index.qmd` if it should be featured there.

**Add an event** – edit `events.qmd` (and the “Next event” box in `index.qmd`).

**Add a publication** – edit `publications.qmd`; only publications approved by the editor are listed.

## Build and publish

Requirements: Python 3 with PyYAML, and Quarto ≥ 1.5 (`pip install quarto-cli pyyaml` is enough).

```bash
quarto preview            # local preview with live reload
scripts/publish.sh        # render and push the result to the main branch
```

`scripts/publish.sh` renders the site into `_site/` and pushes that folder as the content of the `main` branch.

## Rights

© 2026 University of Pannonia. All rights reserved. The name, crest and logo of the University of Pannonia are protected elements of its visual identity. Fonts: Raleway, IBM Plex Serif, Open Sans – SIL Open Font License 1.1 (see `assets/fonts/`). D3 – ISC licence (see `assets/vendor/`).

Member profiles are compiled from public university pages, ORCID, OpenAlex and Google Scholar; corrections can be requested from the coordinator.
