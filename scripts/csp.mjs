// Post-build: writes dist/_headers (Cloudflare Pages) with a strict Content-Security-Policy.
// Inline scripts (the theme/persona boot snippet, any small bundles Astro inlines) are
// allowed by their sha256 hash, so no 'unsafe-inline' or 'unsafe-eval' is needed for scripts.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const htmlFiles = dir => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return f === 'admin' ? [] : htmlFiles(p);
  return f.endsWith('.html') ? [p] : [];
});

const hashes = new Set();
const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
for (const file of htmlFiles(dist)) {
  for (const [, attrs, body] of readFileSync(file, 'utf8').matchAll(re)) {
    if (/type="application\/(ld\+)?json"/.test(attrs) || !body.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
}

const turnstile = 'https://challenges.cloudflare.com';
const site = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

// The CMS loads from unpkg and talks to GitHub, so it gets its own, looser policy.
const admin = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://unpkg.com https://fonts.gstatic.com",
  "connect-src 'self' https: blob:",
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

const common = [
  'Strict-Transport-Security: max-age=31536000; includeSubDomains',
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy: same-origin-allow-popups',
];

const headers = `/*
${common.map(h => '  ' + h).join('\n')}
  Content-Security-Policy: ${site}

/admin/*
  ! Content-Security-Policy
  Content-Security-Policy: ${admin}
  X-Robots-Tag: noindex

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/icons/*
  Cache-Control: public, max-age=604800
`;
writeFileSync(join(dist, '_headers'), headers);
console.log(`_headers: ${hashes.size} inline script hash(es)`);
