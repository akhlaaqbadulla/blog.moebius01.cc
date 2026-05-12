# blog.moebius01.cc

Hugo site for [blog.moebius01.cc](https://blog.moebius01.cc) — portfolio and blog.

Built with [Hugo](https://gohugo.io) and **Nebula** — a custom theme defined in `layouts/`
and `static/`. No external theme, no Node toolchain, no build step beyond Hugo itself.

Deployed automatically to GitHub Pages via GitHub Actions on every push to `main`.

## Local development

```bash
# Install Hugo Extended
brew install hugo                    # macOS
winget install Hugo.Hugo.Extended    # Windows

# Clone
git clone git@github.com:akhlaaqbadulla/blog.moebius01.cc.git
cd blog.moebius01.cc

# Run
hugo server -D                       # → http://localhost:1313
```

## Adding a blog post

```bash
hugo new content/blog/my-post-slug/index.md
# Edit, set draft: false when ready
git add . && git commit -m "blog: add my-post-slug"
```

## Adding a project

```bash
hugo new content/projects/my-project/index.md
# Set front-matter `status:` to "in-progress", "planned", or "completed"
```

## Project layout

- `layouts/` — Nebula theme templates (baseof, partials, section layouts, 404)
- `static/css/` — `nebula.css` (theme) and `chroma.css` (syntax highlighting, generated)
- `static/images/avatar.jpg` — homepage avatar
- `content/` — pages, blog posts, projects, portfolio (page bundles)
- `hugo.toml` + `config/_default/` — site config

## Regenerating syntax highlighting CSS

```bash
hugo gen chromastyles --style=github-dark > static/css/chroma.css
```

## Deployment

Pushing to `main` triggers `.github/workflows/hugo.yml`, which builds with Hugo Extended
and publishes to GitHub Pages. Custom domain set in `static/CNAME` (`blog.moebius01.cc`).

## GitHub Pages setup (one-time)

1. Repo → **Settings → Pages → Source: GitHub Actions**
2. After first deploy, add custom domain `blog.moebius01.cc` and enable **Enforce HTTPS**
