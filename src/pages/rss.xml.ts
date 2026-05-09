import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { filterPublishedPosts } from '../lib/rss';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');
  const published = filterPublishedPosts(posts);

  return rss({
    title: 'Vatsal Bakshi',
    description: 'Software engineer writing about cryptography and distributed systems.',
    site: context.site!,
    items: published
      .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
      .map(post => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishedAt,
        link: `/blog/${post.id.replace(/\.(md|mdx)$/, '')}`,
      })),
  });
}
