// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeProse } from './src/lib/rehype-prose.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://halim.pages.dev',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: page => !page.includes('/admin/') })],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeProse] }),
    // Code blocks are styled to match the design rather than a Shiki theme.
    syntaxHighlight: false,
  },
  build: { inlineStylesheets: 'never' },
  // Keep -webkit- prefixes (e.g. backdrop-filter) for Safari before 18.
  vite: { build: { cssTarget: ['chrome100', 'firefox100', 'safari15'] } },
});
