# blog.moebius01.cc

Personal portfolio and blog for **Mian Budulla** — built with [Hugo](https://gohugo.io/)
and the [Congo](https://jpanther.github.io/congo/) theme, deployed to GitHub Pages.

## Stack

- **Hugo Extended** (static site generator)
- **Congo theme** (pulled as a Hugo Module)
- **GitHub Actions** for CI/CD
- **GitHub Pages** for hosting
- Custom domain: `blog.moebius01.cc`

---

## First-time setup

Your repo: **<https://github.com/akhlaaqbadulla/blog.moebius01.cc>**

### 1. Push this folder to your repo

From inside the `hugo-site/` folder on your machine:

```bash
git init
git add .
git commit -m "Initial commit: Hugo + Congo + GH Pages"
git branch -M main
git remote add origin git@github.com:akhlaaqbadulla/blog.moebius01.cc.git
git push -u origin main
```

If you use HTTPS instead of SSH, swap the remote URL for:

```bash
git remote add origin https://github.com/akhlaaqbadulla/blog.moebius01.cc.git
```

### 2. Enable GitHub Pages

1. In your repo, go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

The workflow at `.github/workflows/hugo.yml` will run on the next push and deploy
automatically.

### 3. Set up the custom domain

1. **Settings → Pages → Custom domain**
2. Enter: `blog.moebius01.cc`
3. After GitHub validates the domain, check **Enforce HTTPS**

Then in your DNS provider for `moebius01.cc`, add a **CNAME record**:

```
Host:   blog
Value:  akhlaaqbadulla.github.io
TTL:    3600
```

GitHub Pages will detect the CNAME file in `static/CNAME` (already included) and serve
the site at <https://blog.moebius01.cc>.

DNS propagation can take 5 minutes to a couple of hours. SSL issuance is automatic
once DNS is verified.

---

## Local development

You need Hugo Extended installed locally.

```bash
# macOS
brew install hugo

# Linux
sudo apt install hugo   # or download from https://github.com/gohugoio/hugo/releases

# Verify
hugo version            # should say "hugo v0.140+ ... extended"
```

Then:

```bash
# Pull the theme module
hugo mod get -u

# Run the dev server
hugo server -D

# Visit http://localhost:1313
```

---

## Adding new blog posts

Use the archetype to scaffold a new post:

```bash
hugo new blog/your-post-slug/index.md
```

This creates a draft post at `content/blog/your-post-slug/index.md` with frontmatter
already in place. Edit it, set `draft: false` when ready, then:

```bash
git add content/blog/your-post-slug/
git commit -m "post: your post title"
git push
```

GitHub Actions will build and deploy automatically.

### Categories

Available categories (each has its own landing page at `/categories/<name>/`):

- `infrastructure` — virtualization, IaC, hybrid patterns
- `security` — hardening, posture, audits, tooling
- `cloud` — Azure, OVH, migration
- `ai-ml` — LLMs, on-prem inference, MCP, agents
- `open-source` — corporate-grade FOSS
- `devops` — automation, pipelines, IaC patterns
- `meta` — about the blog itself

Add a new category by creating `content/categories/<slug>/_index.md` and using the slug
in your post's frontmatter `categories:` list.

### Tags

Free-form. Just use them in frontmatter and Hugo will generate `/tags/<slug>/` pages
automatically.

### Series

For multi-part posts, set `series:` in frontmatter. They'll be grouped at
`/series/<slug>/`.

---

## Updating the portfolio

The portfolio lives at `content/portfolio/_index.md` — edit it like any markdown file.

To replace the downloadable CV linked at the bottom of the portfolio page, drop a file
named `cv.pdf` into the `static/` folder. It will be served at
`https://blog.moebius01.cc/cv.pdf`.

---

## Project structure

```
.
├── .github/workflows/hugo.yml      # CI/CD — builds and deploys on push to main
├── archetypes/blog.md              # template used by `hugo new blog/...`
├── config/_default/                # menus, languages (Congo split-config style)
├── content/
│   ├── _index.md                   # homepage content (rendered by layouts/index.html)
│   ├── portfolio/_index.md         # portfolio page
│   ├── blog/                       # blog posts (one folder per post)
│   └── categories/                 # category landing pages
├── layouts/
│   └── index.html                  # custom homepage layout (hero + two-path cards)
├── static/
│   ├── CNAME                       # custom domain for GitHub Pages
│   └── robots.txt
├── go.mod                          # Hugo module — pulls Congo theme
├── hugo.toml                       # main site config
└── README.md
```

---

## Common tasks

| Task                         | Command                                           |
|------------------------------|---------------------------------------------------|
| Run dev server               | `hugo server -D`                                  |
| New blog post                | `hugo new blog/post-slug/index.md`                |
| Update theme                 | `hugo mod get -u && hugo mod tidy`                |
| Build for production         | `hugo --gc --minify`                              |
| Check site for broken links  | `hugo --printPathWarnings`                        |

---

## Troubleshooting

**GitHub Actions deploy fails on first run**
Likely the Pages source isn't set to "GitHub Actions". Settings → Pages → Source.

**Custom domain shows "DNS check failed"**
Wait 5–30 min after creating the CNAME record. Re-validate in Settings → Pages.

**Theme not loading locally**
Run `hugo mod get -u` to fetch the theme module.

**Mixed content / HTTPS errors**
Confirm `baseURL = "https://blog.moebius01.cc/"` in `hugo.toml` and that
"Enforce HTTPS" is enabled in repo Pages settings.

---

## License

Content (blog posts, portfolio) — all rights reserved.
Code (layouts, config) — feel free to reuse with attribution.
