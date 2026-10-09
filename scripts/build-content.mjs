// Builds content/blog/posts.json from the front matter of content/blog/*.md,
// and stamps sitemap.xml with the newest post date. No dependencies.
// Front matter is JSON between `---` lines (the CMS writes it that way).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = join(root, 'content/blog');
const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const posts = [];
for (const name of readdirSync(blogDir).filter(f => f.endsWith('.md')).sort()) {
  const src = readFileSync(join(blogDir, name), 'utf8');
  const m = src.match(FM);
  if (!m) { console.warn(`skip ${name}: no front matter`); continue; }
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${name}: front matter is not valid JSON — ${e.message}`); }
  if (meta.draft) continue;
  const body = src.slice(m[0].length);
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  const slug = meta.slug || name.replace(/\.md$/, '');
  posts.push({
    slug,
    title: meta.title || slug,
    date: meta.date || '',
    summary: meta.summary || '',
    cover: meta.cover || '',
    tags: meta.tags || [],
    file: `content/blog/${name}`,
    canonical: meta.canonical || '',
    persona: meta.persona || 'dev',
    readMins: Number(meta.readMins) || Math.max(1, Math.round(words / 220))
  });
}
posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
writeFileSync(join(blogDir, 'posts.json'), JSON.stringify({ posts }, null, 2) + '\n');

const sitemapPath = join(root, 'sitemap.xml');
const lastmod = posts[0]?.date;
if (lastmod) {
  const xml = readFileSync(sitemapPath, 'utf8')
    .replace(/<lastmod>[^<]*<\/lastmod>/g, '')
    .replace(/(<loc>https:\/\/hajisml\.github\.io\/#blog<\/loc>)/, `$1<lastmod>${lastmod}</lastmod>`);
  writeFileSync(sitemapPath, xml);
}
console.log(`posts.json: ${posts.length} post(s)`);
