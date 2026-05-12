# blog.moebius01.cc

Hugo site for [blog.moebius01.cc](https://blog.moebius01.cc) — portfolio and blog.

Built with [Hugo](https://gohugo.io) and the [Congo](https://jpanther.github.io/congo/) theme.
Deployed automatically to GitHub Pages via GitHub Actions on every push to `main`.

## Local development

```bash
# Install Hugo Extended (required — Congo uses Hugo Pipes)
brew install hugo        # macOS
winget install Hugo.Hugo.Extended  # Windows

# Clone and enter
git clone git@github.com:akhlaaqbadulla/blog.moebius01.cc.git
cd blog.moebius01.cc

# Clone the theme (matches the workflow)
git clone --depth 1 --branch v2.10.0 https://github.com/jpanther/congo.git themes/congo

# Start dev server
hugo server -D
# → http://localhost:1313
```

## Adding a blog post

```bash
hugo new content/blog/my-post-slug/index.md
# Edit the file, set draft: false when ready
git add . && git commit -m "blog: add my-post-slug" && git push
```

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/hugo.yml`),
which clones the Congo theme, builds the site with Hugo Extended, and deploys to
GitHub Pages automatically.

The custom domain is configured via `static/CNAME` (`blog.moebius01.cc`).
DNS: `CNAME blog → akhlaaqbadulla.github.io`

## GitHub Pages setup (one-time)

1. Repo → **Settings → Pages → Source: GitHub Actions**
2. After first successful deploy, add custom domain `blog.moebius01.cc` and enable **Enforce HTTPS**
