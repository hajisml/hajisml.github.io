#!/usr/bin/env bash
# Copies the publishable site from a checkout into an output folder.
#   stage-site.sh <srcdir> <outdir>            production build
#   stage-site.sh <srcdir> <outdir> staging    staging build (served under /staging/)
set -euo pipefail

src=${1:?usage: stage-site.sh <srcdir> <outdir> [staging]}
out=${2:?usage: stage-site.sh <srcdir> <outdir> [staging]}
mode=${3:-prod}

mkdir -p "$out"
cp -r "$src"/{index.html,support.js,404.html,.nojekyll,admin,assets,content} "$out"/

if [ "$mode" = staging ]; then
  # Keep staging out of search results and make it obvious which site you're on.
  badge='<div style="position:fixed;left:12px;bottom:12px;z-index:9999;padding:4px 10px;border-radius:999px;background:#d97706;color:#fff;font:600 11px/1.6 system-ui,sans-serif;letter-spacing:.12em;pointer-events:none">STAGING</div>'
  sed -i -e 's#<meta charset="utf-8">#&\n<meta name="robots" content="noindex">#' \
         -e "s|</body>|${badge}\n</body>|" "$out/index.html"
  sed -i 's#url=/#url=/staging/#; s#href="/"#href="/staging/"#' "$out/404.html"
else
  cp "$src"/{robots.txt,sitemap.xml} "$out"/
fi
