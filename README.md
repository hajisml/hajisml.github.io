# hajisml.github.io

Portfolio and blog for Haji Ismael Ibrahim (Halim), served from GitHub Pages at https://hajisml.github.io.

The page is one static file (`index.html`, rendered in the browser by `support.js`). Everything it shows comes from `content/`, so changing the site means changing content, not code.

## Content

| File | What it holds |
| --- | --- |
| `content/site.json` | Profile, personas (Software / Design switch), facts, socials, experience, education, quote, contact |
| `content/projects.json` | Projects. Featured ones are shown first. Each gets a deep link: `/#project/<slug>` |
| `content/blog/*.md` | Blog posts: JSON front matter between `---` lines, then Markdown. Deep link: `/#blog/<slug>` |
| `content/blog/posts.json` | **Generated** index of posts. Don't edit it; run `node scripts/build-content.mjs` |
| `assets/uploads/` | Images uploaded through the CMS |

## Editing

**In the browser (CMS):** open https://hajisml.github.io/admin/, choose *Sign In with Token*, and paste a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) that only covers `hajisml/hajisml.github.io` and has **Contents: Read and write**. Each save is committed to `main`, and the site redeploys within a minute or two.

**By hand / with Claude Code:** edit the JSON or Markdown files and push to `main`. To add a post, copy `content/blog/propersats.md` and change its front matter and body.

## Running locally

```sh
node scripts/build-content.mjs   # refresh the blog index after adding or changing posts
python3 -m http.server 8000      # then open http://localhost:8000
```

Opening `index.html` straight from disk won't work, because the page fetches `content/` over HTTP. For a local CMS, open http://localhost:8000/admin/ in a Chromium-based browser and choose *Work with Local Repository*. It writes straight to your working copy.

## Deploy

`.github/workflows/pages.yml` runs on every push to `main`: it builds the blog index, collects the site files, and deploys them to GitHub Pages. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Contact form

Leave `contact.formspree` blank to fall back to `mailto:`, or paste a Formspree endpoint to receive submissions.

## Design source

The design lives in Claude Design (`Portfolio.dc.html`). If it changes, re-export it to `index.html` and carry over one local edit: in `md2html` the leading front matter is stripped (`.replace(/^---\n[\s\S]*?\n---\n?/, '')`).
