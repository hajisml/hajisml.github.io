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

**In the browser (CMS):** open https://hajisml.github.io/admin/, choose *Sign In with Token*, and paste a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) that only covers `hajisml/hajisml.github.io` and has **Contents: Read and write**. Each save is committed to the `staging` branch and shows up on the staging site within a minute or two.

**By hand / with Claude Code:** edit the JSON or Markdown files on the `staging` branch and push. To add a post, copy `content/blog/propersats.md` and change its front matter and body.

## Running locally

```sh
node scripts/build-content.mjs   # refresh the blog index after adding or changing posts
python3 -m http.server 8000      # then open http://localhost:8000
```

Opening `index.html` straight from disk won't work, because the page fetches `content/` over HTTP. For a local CMS, open http://localhost:8000/admin/ in a Chromium-based browser and choose *Work with Local Repository*. It writes straight to your working copy.

## Staging & production

| Branch | Site |
| --- | --- |
| `staging` | https://hajisml.github.io/staging/ (hidden from search engines, marked with a STAGING badge) |
| `main` | https://hajisml.github.io |

1. Edits (CMS or by hand) go to `staging`. Check them on the staging site.
2. When you're happy, open **Actions → Promote to production → Run workflow**. It fast-forwards `main` to `staging` and redeploys.

**Hotfix straight to production:** push to `main`, then bring staging up to date with `git checkout staging && git merge main && git push`. Promote refuses to run while `main` has commits that `staging` doesn't.

## Deploy

`.github/workflows/pages.yml` runs on every push to `main` or `staging`. It builds both branches (`main` at `/`, `staging` at `/staging/`) with `scripts/build-content.mjs` and `scripts/stage-site.sh`, then publishes them as one GitHub Pages deployment.

One-time setup, already done:
- **Settings → Pages → Source:** GitHub Actions.
- **Settings → Environments → github-pages:** allows both `main` and `staging` to deploy.

## Contact form

Leave `contact.formspree` blank to fall back to `mailto:`, or paste a Formspree endpoint to receive submissions.

## Design source

The design lives in Claude Design (`Portfolio.dc.html`). If it changes, re-export it to `index.html` and carry over one local edit: in `md2html` the leading front matter is stripped (`.replace(/^---\n[\s\S]*?\n---\n?/, '')`).
