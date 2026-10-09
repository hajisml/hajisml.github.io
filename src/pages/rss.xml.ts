import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, getSite } from '../lib/site';

export async function GET(context: APIContext) {
  const [posts, site] = await Promise.all([getPosts(), getSite()]);
  return rss({
    title: `${site.name} — Blog`,
    description: 'Backend engineering, Bitcoin & Lightning, distributed systems, hackathons and design.',
    site: context.site!,
    items: posts.map(p => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: new Date(p.data.date + 'T00:00:00Z'),
      link: `/blog/${p.data.slug}/`,
      categories: p.data.tags,
    })),
  });
}
