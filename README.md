# Solid Ash Heirloom Bed — interactive viewer

Public, always‑current 3D viewer for the Solid Ash Heirloom Bed project. Hosts only the self‑contained
interactive models so they can be shared with the builder via a live link, while the full project repo
stays private.

**Live:** https://chase-m-uba.github.io/bed-frame-viewer/

- `index.html` — landing page / hub
- `BF-M01_master-assembly.html` — full‑bed master assembly (orbit / explode / isolate / layers)
- `BF-D08_mullion-topcap-ujoint-detail.html` — mullion / top‑cap three‑land W‑joint detail

The models pull three.js from the unpkg CDN, so these files are fully self‑contained — no build step.

These files are **published copies** generated from the private `bed-frame` project repo (the source of
truth). To update the live models, re‑copy the latest viewer HTML from the project and push to this repo.
Units are inches; V1 builder‑review geometry.
