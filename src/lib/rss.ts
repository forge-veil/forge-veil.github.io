export interface PostLike {
  data: { published: boolean; wip: boolean };
}

export function filterPublishedPosts<T extends PostLike>(posts: T[]): T[] {
  return posts.filter(p => p.data.published && !p.data.wip);
}
