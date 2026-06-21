# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Local development (requires Hugo 0.126+)
hugo server -D          # serve including drafts (approved: false)
hugo server             # serve approved + non-expired only (production view)

# Production build (matches Netlify/CI)
hugo --gc --minify

# Create a new listing stub
hugo new listings/ls-XXXXXX.md
```

There are no npm scripts, no test suite, and no linter. The only runtime tool is Hugo ≥ 0.126.0 (non-extended).

## Architecture

**Pure static site.** Hugo generates HTML at build time; there is no runtime server. Hosting targets are Netlify (primary) or GitHub Pages (via `.github/workflows/deploy.yml`).

### Listing lifecycle

A listing is a Markdown file under `content/listings/`. Two frontmatter fields gate its visibility:

1. `approved: true` — admin toggles this via Decap CMS at `/admin/`
2. `expiryDate` — Hugo's built-in field; pages past this date are **not rendered at build time** (no template filtering needed)

The `expiryDate` should always be `date + 15 days`. The GitHub Actions cron (`0 0 * * *`) runs a Python script that physically deletes expired `.md` files and commits the removal before rebuilding, keeping the repo clean.

### Template hierarchy

```
layouts/_default/baseof.html     ← html/head/body shell; all pages inherit this
layouts/partials/head.html        ← <head> incl. Netlify Identity widget script
layouts/partials/header.html      ← sticky frosted nav with "+ מודעה" button
layouts/partials/listing-card.html ← reusable card (used by index + list)
layouts/index.html                ← homepage; filters to approved pages only
layouts/listings/list.html        ← /listings/ section; same filter
layouts/listings/single.html      ← individual listing; QR code, Telegram btns
layouts/_default/submit.html      ← submission form (layout: "submit" in frontmatter)
```

Hugo's `expiryDate` removes expired pages before templates run, so **no template should re-implement expiry logic** — it was already removed.

### Admin workflow (Decap CMS)

`/admin/` is a static Decap CMS SPA (`static/admin/index.html` + `static/admin/config.yml`). It uses Netlify Identity (git-gateway backend). `create: false` in `config.yml` means admin can only approve/delete existing submissions, not create new ones. To enable:

1. Netlify Dashboard → Identity → Enable → Settings → Registration: **Invite only**
2. Identity → Services → **Enable Git Gateway**
3. Invite the admin email

### Submission flow

The form at `/submit/` posts to **Netlify Forms** (`data-netlify="true"`). On success it redirects to `/submit/?thanks=1`; `static/js/app.js` reads that query param and swaps the form for a success message. Admin receives an email from Netlify, then manually creates the `.md` file (or the seller emails it), sets `approved: true`, and triggers a rebuild.

### QR codes

Generated entirely client-side on the listing single page using `qrcodejs@1.0.0` from jsDelivr CDN. The script reads `window.location.href` so it encodes the live URL, not the Hugo `{{ .Permalink }}`.

### CSS / JS constraints

- `static/css/main.css` is the only stylesheet — no framework, no build step
- `max-width: 430px` on `body` enforces mobile-only layout; desktop shows a centered frame
- The site is Hebrew RTL (`lang="he" dir="rtl"` on `<html>`); all layout is right-to-left
- `static/js/app.js` handles only two things: category filter chips and the submit-form success state
- The CSP in `netlify.toml` allows `unsafe-inline` scripts (required for the inline QR init block in `single.html`) and `cdn.jsdelivr.net` + `identity.netlify.com`

### Frontmatter reference

```yaml
listing_no: "LS-000042"          # display ID shown on card and page
date: 2026-06-21T10:00:00+03:00
expiryDate: 2026-07-06T10:00:00+03:00   # exactly date + 15 days
approved: false                  # admin sets to true to publish
category: "iPhone"               # iPhone | iPad | Mac | Apple Watch | AirPods | אחר
model: "iPhone 15 Pro"
storage: "256GB"
color: "..."
condition: "כמו חדש"            # חדש | כמו חדש | טוב מאוד | טוב | סביר
price: "₪3,500"
location: "תל אביב-יפו"
telegram_username: "handle"      # without @ prefix; used as t.me/handle
images: []
```

### Deployment

- **Netlify**: connect repo, build command `hugo --minify`, publish dir `public`. Netlify auto-detects `netlify.toml`. Set `HUGO_VERSION = "0.126.0"` is already in `netlify.toml`.
- **GitHub Pages**: the Actions workflow handles build + deploy on push to `main` and on the daily cron. Requires GitHub Pages enabled with "GitHub Actions" as the source in repo settings.
- `baseURL = "/"` in `hugo.toml` is intentionally relative; override it with `--baseURL` flag in CI if canonical URLs are needed.
