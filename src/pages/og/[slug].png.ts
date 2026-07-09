import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgPng } from '../../lib/og/card';
import { motifFor } from '../../lib/og/motifs';

const slugOf = (post: CollectionEntry<'posts'>) => post.id.replace(/\.(md|mdx)$/, '');

export async function getStaticPaths() {
  const posts = await getCollection(
    'posts',
    ({ data }: CollectionEntry<'posts'>) => data.published || import.meta.env.DEV,
  );
  return posts.map((post: CollectionEntry<'posts'>) => ({
    params: { slug: slugOf(post) },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: CollectionEntry<'posts'> };
  const d = post.data;
  const seriesLabel = d.series ? `${d.series.name.toUpperCase()} · PART ${d.series.part}` : undefined;
  const png = await renderOgPng({
    title: d.title,
    description: d.description,
    topicLabel: d.topic,
    seriesLabel,
    motifSvg: motifFor({ ogMotif: d.ogMotif, topic: d.topic }),
  });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
