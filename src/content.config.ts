// Content lives in /content (edited by the CMS). These schemas mirror
// public/admin/config.yml, so a bad edit fails the build instead of the page.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const persona = z.enum(['dev', 'design']);
const audience = z.enum(['all', 'dev', 'design']).default('all');

const site = defineCollection({
  loader: file('content/site.json', { parser: text => [{ id: 'site', ...JSON.parse(text) }] }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    role: z.string(),
    location: z.string(),
    email: z.string(),
    availability: z.string(),
    resume: z.string(),
    facts: z.array(z.object({ k: z.string(), v: z.string(), persona: audience })),
    socials: z.array(z.object({ label: z.string(), url: z.string(), icon: z.string(), persona: audience })),
    experience: z.array(z.object({
      company: z.string(), role: z.string(), period: z.string(), location: z.string(),
      points: z.array(z.string()), persona: audience,
    })),
    education: z.array(z.object({
      school: z.string(), degree: z.string(), detail: z.string(), year: z.string(), location: z.string(),
    })),
    contact: z.object({ heading: z.string(), blurb: z.string(), formspree: z.string().optional() }),
    personas: z.array(z.object({
      id: persona,
      label: z.string(),
      title: z.string(),
      email: z.string().optional(),
      logo: z.string(),
      logoName: z.string(),
      heroTitle: z.string(),
      tagline: z.string(),
      focus: z.string().optional(),
      availability: z.string(),
      intro: z.string(),
      about: z.array(z.string()),
      learning: z.array(z.object({ title: z.string(), since: z.string(), detail: z.string(), topics: z.array(z.string()) })).default([]),
      skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })).default([]),
    })).min(1),
    quote: z.object({ text: z.string(), author: z.string() }),
  }),
});

const projects = defineCollection({
  loader: file('content/projects.json', {
    // `order` keeps the order of the JSON list (the CMS lets you drag to reorder).
    parser: text => JSON.parse(text).projects.map((p: { slug: string }, order: number) => ({ id: p.slug, order, ...p })),
  }),
  schema: z.object({
    order: z.number(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase-dashes'),
    persona: persona.default('dev'),
    title: z.string(),
    subtitle: z.string(),
    year: z.string().default(''),
    category: z.string(),
    featured: z.boolean().default(false),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    cover: z.string().default(''),
    coverFit: z.enum(['cover', 'contain']).default('cover'),
    repo: z.string().default(''),
    live: z.string().default(''),
    source: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    // The CMS writes YYYY-MM-DD; YAML may also hand back a Date.
    date: z.preprocess(v => (v instanceof Date ? v.toISOString().slice(0, 10) : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    summary: z.string(),
    cover: z.string().default(''),
    tags: z.array(z.string()).default([]),
    canonical: z.string().default(''),
    persona: persona.default('dev'),
    readMins: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { site, projects, blog };
