import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const TOPICS = [
  {
    slug: 'quantum-crypto',
    name: 'Quantum Cryptography',
    description: '',
  },
  {
    slug: 'quantum-computing',
    name: 'Quantum Computing',
    description: '',
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      topic: z.enum(TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]]),
      series: z
        .object({
          slug: z.string(),
          name: z.string(),
          part: z.number().int().positive(),
        })
        .optional(),
      tags: z.array(z.string()).default([]),
      publishedAt: z.coerce.date(),
      published: z.boolean().default(false),
    }),
  }),
};
