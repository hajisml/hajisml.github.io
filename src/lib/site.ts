// Data helpers shared by pages and components (ported from the design's renderVals()).
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Site = CollectionEntry<'site'>['data'];
export type Persona = Site['personas'][number];
export type Project = CollectionEntry<'projects'>['data'];
export type Post = CollectionEntry<'blog'>;
export type PersonaId = Persona['id'];

export async function getSite(): Promise<Site> {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('content/site.json is missing');
  return entry.data;
}

export async function getProjects(): Promise<Project[]> {
  return (await getCollection('projects')).map(p => p.data).sort((a, b) => a.order - b.order);
}

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', p => !p.data.draft);
  return posts.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

/** Content stores paths like "assets/x.svg"; pages live at any depth, so make them root-relative. */
export const asset = (p: string) => (!p || /^(https?:|mailto:|\/|#|data:)/.test(p) ? p : '/' + p);

/** Items tagged for everyone or for this persona. */
export const mine = <T extends { persona?: string }>(arr: T[], id: PersonaId) =>
  arr.filter(x => !x.persona || x.persona === 'all' || x.persona === id);

export const emailFor = (site: Site, p: Persona) => p.email || site.email || '';

export const fitOf = (p: Project) =>
  p.coverFit === 'contain' ? { fit: 'contain', pad: '7% 0' } : { fit: 'cover', pad: '0' };

export const projectsFor = (all: Project[], id: PersonaId) =>
  all.filter(p => p.persona === id).sort((a, b) => Number(b.featured) - Number(a.featured));

export const liveOf = (p: Project) =>
  /behance/i.test(p.live)
    ? { label: 'View on Behance', icon: '/assets/icons/si/behance.svg' }
    : { label: 'Live demo', icon: '/assets/icons/lucide/globe.svg' };

export const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const readMins = (p: Post) =>
  p.data.readMins ?? Math.max(1, Math.round((p.body || '').replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length / 220));

/** "Originally published on …" label for a canonical URL. */
export const canonicalHost = (url: string) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return h === 'dev.to' ? 'DEV Community' : h === 'medium.com' ? 'Medium' : h;
  } catch { return ''; }
};

const SI: Record<string, string> = {
  'go': 'go', 'python': 'python', 'javascript': 'javascript', 'html/css': 'html5', 'fastapi': 'fastapi', 'flask': 'flask',
  'spring boot': 'springboot', 'node / deno': 'nodedotjs', 'react': 'react', 'postgresql': 'postgresql', 'mongodb': 'mongodb',
  'redis': 'redis', 'sqlite fts5': 'sqlite', 'docker / podman': 'docker', 'aws': 'amazonaws', 'linux': 'linux',
  'ci/cd': 'githubactions', 'figma': 'figma', 'adobe photoshop': 'adobephotoshop', 'adobe illustrator': 'adobeillustrator',
  'java': 'openjdk',
};
const GLYPHS = ['polygon(50% 6%, 96% 90%, 4% 90%)', 'circle(46% at 50% 50%)', 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)'];

export const skillGroups = (p: Persona) =>
  p.skills.map((g, gi) => {
    const items = g.items.map((name, i) => {
      const slug = SI[name.toLowerCase()];
      return slug
        ? { name, mask: `url(/assets/icons/si/${slug}.svg)`, clip: 'none', size: '28px' }
        : { name, mask: 'none', clip: GLYPHS[i % 3], size: '18px' };
    });
    return { group: g.group, items, num: String(gi + 1).padStart(2, '0'), count: items.length + (items.length === 1 ? ' tool' : ' tools') };
  });

export const socialMask = (s: Site['socials'][number]) =>
  s.label === 'Email' ? 'url(/assets/icons/lucide/mail.svg)' : `url(${asset(s.icon)})`;

export const BLOG_COPY: Record<PersonaId, { kicker: string; intro: string }> = {
  dev: { kicker: 'the dev', intro: 'Notes from the terminal — backend engineering, Bitcoin & Lightning, distributed systems and hackathons.' },
  design: { kicker: 'the design', intro: 'Notes from the drawing board — identity, type, image-making and the process behind the marks.' },
};

export { TITLES } from '../scripts/titles';
