import type { VFile } from 'vfile';

/**
 * Check whether the current VFile originates from an MDX document.
 *
 * Shoka remark/rehype extensions emit raw `html` nodes or parse `{...}` syntax
 * that collides with MDX JSX expressions and imports. Guarding those plugins
 * keeps `.mdx` processed strictly by `@astrojs/mdx` while preserving full
 * Shoka behavior for `.md` posts.
 */
export function isMdxFile(file?: Partial<Pick<VFile, 'path' | 'history'>>): boolean {
  const filePath = file?.path ?? file?.history?.[0];
  return typeof filePath === 'string' && /\.mdx$/i.test(filePath);
}
