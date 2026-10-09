# hajisml portfolio — Astro on Cloudflare Pages

Portfolio and blog for Haji Ismael Ibrahim (Halim). This branch (`astroworld`) is the Astro rewrite. It deploys to Cloudflare Pages, while the original site keeps running from `main` on GitHub Pages until cutover.

- **Static pages:** Astro renders every page to HTML at build time, with real URLs for each project (`/projects/<slug>/`) and post (`/blog/<slug>/`), plus RSS and a sitemap.
- **Content:** it lives in `content/`, in the same format the CMS already edits. Schemas in `src/content.config.ts` check it, so a bad edit fails the build instead of breaking the live page.
- **No framework:** the interactive parts (hero intro, scroll effects, snow, menu wheel, persona switch, search, project modal) are small TypeScript modules in `src/scripts/`, with no React.
- **Security:** a strict Content-Security-Policy and security headers are generated at build time by `scripts/csp.mjs`.
- **Contact form:** a Cloudflare Pages Function (`functions/api/contact.ts`) checks the message with Turnstile and sends it through Resend.

## Layout

| Path | What it is |
| --- | --- |
| `content/` | `site.json`, `projects.json`, `blog/*.md` (JSON front matter between `---` lines) |
| `src/pages/` | Routes: `/`, `/projects/[slug]/`, `/blog/`, `/blog/[slug]/`, `/rss.xml`, 404 |
| `src/components/` | Page sections (Hero, Work, About, Quote, Experience, Skills, Learning, Contact, …) |
| `src/scripts/` | Client behaviour, one module per feature |
| `src/styles/global.css` | Design tokens and component styles |
| `public/` | Static files: `assets/` (fonts, icons, images, CV), `admin/` (CMS) |
| `functions/api/contact.ts` | Contact form endpoint |
| `scripts/csp.mjs` | Post-build `_headers` generator (CSP hashes, caching) |

## Develop

```sh
npm install
npm run dev        # http://localhost:4321 with live reload
npm run build      # static build into dist/ and dist/_headers
npm run preview    # Cloudflare runtime locally (headers + /api/contact) on http://localhost:8788
npm run check      # type-check
```

For the contact form locally, put secrets in `.dev.vars` (git-ignored):

```
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
RESEND_API_KEY=re_...
```

Then build with Turnstile's test site key: `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build`.

## Deploy

`.github/workflows/cloudflare.yml` builds the site and runs `wrangler pages deploy` on every push to `astroworld`. Each branch gets its own preview URL (`<branch>.<project>.pages.dev`).

| Where | Name | Value |
| --- | --- | --- |
| GitHub secret | `CLOUDFLARE_API_TOKEN` | API token with **Cloudflare Pages: Edit** |
| GitHub secret | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| GitHub variable | `CF_PAGES_PROJECT` | Pages project name (default `halim`) |
| GitHub variable | `TURNSTILE_SITE_KEY` | Public Turnstile site key (no key: the form uses `mailto:`) |
| Pages secret | `TURNSTILE_SECRET` | Turnstile secret key |
| Pages secret | `RESEND_API_KEY` | Resend API key |
| `wrangler.toml` var | `CONTACT_TO` | Inbox that receives messages. On Resend's free tier without a verified domain, this must be the Resend account's own address |

Set the Pages secrets with `npx wrangler pages secret put TURNSTILE_SECRET --project-name halim` (and the same for `RESEND_API_KEY`).

## Contact form and spam

1. Spam traps run in the browser: a hidden field that only bots fill, plus a minimum time on the form.
2. Turnstile (invisible unless it's unsure) issues a token, and the function verifies it with Cloudflare before sending.
3. The function checks the request's origin and content type, validates and caps every field, and escapes the HTML email.
4. If the secrets aren't configured, the function returns 503 and the page falls back to `mailto:`.

## CMS

Sveltia CMS lives at `/admin/` (`public/admin/`) and still commits to the `staging` branch. Its content format is unchanged, so the old and new sites read the same files.

**At cutover:**
- Point `media_folder` at `public/assets/uploads`.
- Move any files uploaded in the meantime from `assets/uploads/` into `public/assets/uploads/`.
