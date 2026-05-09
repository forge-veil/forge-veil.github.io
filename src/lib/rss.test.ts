import { describe, it, expect } from 'vitest';
import { filterPublishedPosts } from './rss';

interface MinPost {
  data: { published: boolean; wip: boolean };
}

function post(published: boolean, wip: boolean): MinPost {
  return { data: { published, wip } };
}

describe('filterPublishedPosts', () => {
  it('includes published non-wip posts', () => {
    const result = filterPublishedPosts([post(true, false)]);
    expect(result).toHaveLength(1);
  });

  it('excludes unpublished posts', () => {
    const result = filterPublishedPosts([post(false, false)]);
    expect(result).toHaveLength(0);
  });

  it('excludes wip posts even if published', () => {
    const result = filterPublishedPosts([post(true, true)]);
    expect(result).toHaveLength(0);
  });

  it('handles mixed list correctly', () => {
    const posts = [
      post(true, false),
      post(false, false),
      post(true, true),
      post(true, false),
    ];
    const result = filterPublishedPosts(posts);
    expect(result).toHaveLength(2);
  });
});
