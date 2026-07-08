import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const TOPICS = [
  {
    slug: 'quantum-computing',
    name: 'Quantum Computing',
    description: '',
  },
  {
    slug: 'golf',
    name: 'Golf',
    description: '',
  },
  {
    slug: 'mathematics',
    name: 'Mathematics',
    description: '',
  },
  {
    slug: 'security',
    name: 'Security',
    description: '',
  },
  {
    slug: 'finance',
    name: 'Finance',
    description: '',
  },
  {
    slug: 'personal',
    name: 'Personal',
    description: '',
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      // Optional keyword-focused title for the <title>/OG tags; the visible H1 still uses `title`.
      seoTitle: z.string().optional(),
      description: z.string(),
      topic: z.enum(TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]]),
      series: z
        .object({
          slug: z.string(),
          name: z.string(),
          part: z.number().int().positive(),
          total: z.number().int().positive().optional(),
        })
        .optional(),
      tags: z.array(z.string()).default([]),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      published: z.boolean().default(false),
      wip: z.boolean().default(false),
      postLayout: z.enum(['longform']).optional(),
    }),
  }),
};
