/**
 * Shared RSS feed utilities.
 *
 * Extracted from rss.xml.ts and [lang]/rss.xml.ts to avoid logic duplication.
 */
import { buildPlainRssItemFields } from '@lib/rss-fields';
import { t } from '@/i18n';
import type { BlogPost } from '@/types/blog';

/** Build RSS item fields, handling encrypted posts and MDX entries without pre-rendered HTML */
export function buildRssItemFields(post: BlogPost, locale: string): { title: string; description: string; content: string } {
  if (post.data.password) {
    const rssNotice = t(locale, 'encrypted.post.rssNotice');
    return {
      title: `🔒 ${post.data.title}`,
      description: rssNotice,
      content: `<p>${rssNotice}</p>`,
    };
  }

  return buildPlainRssItemFields(post);
}
