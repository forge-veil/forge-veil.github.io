// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://forge-veil.github.io',
  vite: {
    plugins: [tailwindcss()],
    build: {
      modulePreload: {
        polyfill: true,
        resolveDependencies: (_url, deps) =>
          deps.filter(dep => !dep.includes('three')),
      },
    },
  },
  integrations: [
    sitemap(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'], properties: { className: ['external-link'] } }],
      ],
    }),
  ],
});
