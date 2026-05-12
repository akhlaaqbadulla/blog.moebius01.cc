---
title: "Nebula — Custom Hugo Theme"
date: 2026-05-12
summary: "A self-contained dark/neon Hugo theme built from scratch for blog.moebius01.cc — no Tailwind, no build step, zero external theme dependency."
status: "in-progress"
stack:
  - "Hugo 0.161"
  - "CSS"
  - "GitHub Actions"
---

Nebula is the theme powering this site. It replaces a vendored Congo theme with a fully self-contained set of layouts and a single CSS file — no Node, no Tailwind build, no theme submodule. Designed around a purple/neon "space" aesthetic with glassmorphism cards and a print stylesheet for clean CV export.

**Why build it:** I wanted a personal identity I controlled end-to-end, and a portfolio I could `Cmd+P` straight to PDF for recruiter handoff.

**Status:** Shipped first iteration; iterating on per-section polish, dark/light toggle, and a small JS-free search index.
