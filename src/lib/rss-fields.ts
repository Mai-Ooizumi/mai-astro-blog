import { extractTextFromMarkdown, getSanitizeHtml, stripHtmlToText } from '@lib/sanitize';
import type { BlogPost } from '@/types/blog';

function escapeXmlText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Build RSS item fields for non-encrypted posts, falling back to extracted prose
 * when `.mdx` entries have no `rendered.html`.
 */
export function buildPlainRssItemFields(post: Pick<BlogPost, 'body' | 'data' | 'rendered'>): {
  title: string;
  description: string;
  content: string;
} {
  const renderedHtml = post.rendered?.html ?? '';
  const fallbackText = extractTextFromMarkdown(post.body ?? '', 300);
  const description = post.data?.description ?? (renderedHtml ? stripHtmlToText(renderedHtml) : fallbackText);
  const content = renderedHtml
    ? getSanitizeHtml(renderedHtml)
    : `<p>${escapeXmlText(post.data?.description ?? fallbackText)}</p>`;

  return {
    title: post.data.title,
    description,
    content,
  };
}
