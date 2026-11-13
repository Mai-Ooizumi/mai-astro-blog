import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root as HastRoot } from 'hast';
import { toHtml } from 'hast-util-to-html';
import type { Root as MdastRoot } from 'mdast';
import remarkDirective from 'remark-directive';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { isMdxFile } from '@/lib/markdown/mdx-utils';
import { rehypeEncryptedBlock } from '@/lib/markdown/rehype-encrypted-block';
import { rehypeEncryptedPost } from '@/lib/markdown/rehype-encrypted-post';
import { rehypeShokaAttrs } from '@/lib/markdown/rehype-shoka-attrs';
import { remarkEncryptedDirective } from '@/lib/markdown/remark-encrypted-directive';
import { remarkLiteralDirectives } from '@/lib/markdown/remark-literal-directives';
import { remarkIns, remarkMark } from '@/lib/markdown/remark-shoka-effects';
import { remarkShokaPreprocess } from '@/lib/markdown/remark-shoka-preprocess';
import { remarkShokaRuby } from '@/lib/markdown/remark-shoka-ruby';
import { remarkShokaSpoiler } from '@/lib/markdown/remark-shoka-spoiler';
import { buildPlainRssItemFields } from '@/lib/rss-fields';
import { extractTextFromMarkdown } from '@/lib/sanitize';
import type { BlogPost } from '@/types/blog';

async function runKoharuMarkdownPipeline(source: string, filePath: string, frontmatter?: Record<string, unknown>) {
  const file = new VFile({ value: source, path: filePath });
  if (frontmatter) {
    file.data.astro = { frontmatter };
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkShokaPreprocess, {
      enableContainers: true,
      enableHexoTags: false,
      enableSuperSub: true,
      enableMath: false,
      enableEncryptedBlock: true,
    })
    .use(remarkShokaSpoiler)
    .use(remarkShokaRuby)
    .use(remarkIns)
    .use(remarkMark)
    .use(remarkDirective)
    .use(remarkLiteralDirectives)
    .use(remarkEncryptedDirective)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShokaAttrs)
    .use(rehypeEncryptedBlock)
    .use(rehypeEncryptedPost);

  const hast = (await processor.run(processor.parse(file), file)) as HastRoot;
  return toHtml(hast, { allowDangerousHtml: true });
}

test('isMdxFile detects .mdx case-insensitively and ignores .md', () => {
  assert.equal(isMdxFile({ path: 'src/content/blog/post.mdx' }), true);
  assert.equal(isMdxFile({ path: 'src/content/blog/post.MDX' }), true);
  assert.equal(isMdxFile({ history: ['src/content/blog/post.mdx'] }), true);
  assert.equal(isMdxFile({ path: 'src/content/blog/post.md' }), false);
  assert.equal(isMdxFile(undefined), false);
});

test('Shoka remark/rehype plugins skip .mdx files while preserving .md transforms', async () => {
  const sample = [
    '++inserted++ ==highlighted== !!secret!! {漢字^かんじ} ~sub~ ^sup^',
    '',
    '[styled]{.badge}',
    '',
    ':::info',
    'Container body',
    ':::',
  ].join('\n');

  const mdHtml = await runKoharuMarkdownPipeline(sample, 'src/content/blog/test.md');
  assert.match(mdHtml, /<ins>inserted<\/ins>/);
  assert.match(mdHtml, /<mark>highlighted<\/mark>/);
  assert.match(mdHtml, /<spoiler-span>secret<\/spoiler-span>/);
  assert.match(mdHtml, /<ruby>漢字/);
  assert.match(mdHtml, /<sub>sub<\/sub>/);
  assert.match(mdHtml, /<sup>sup<\/sup>/);
  assert.match(mdHtml, /<span class="badge">styled<\/span>/);
  assert.match(mdHtml, /class="note-block note-info"/);

  const mdxHtml = await runKoharuMarkdownPipeline(sample, 'src/content/blog/test.mdx');
  assert.doesNotMatch(mdxHtml, /<ins>/);
  assert.doesNotMatch(mdxHtml, /<mark>/);
  assert.doesNotMatch(mdxHtml, /<spoiler-span>/);
  assert.doesNotMatch(mdxHtml, /<ruby>/);
  assert.doesNotMatch(mdxHtml, /<sub>/);
  assert.doesNotMatch(mdxHtml, /<sup>/);
  assert.doesNotMatch(mdxHtml, /class="badge"/);
  assert.doesNotMatch(mdxHtml, /note-block/);
  assert.match(mdxHtml, /\+\+inserted\+\+/);
  assert.match(mdxHtml, /\{漢字\^かんじ\}/);
});

test('encrypted plugins skip .mdx files so raw password blocks never run in MDX', async () => {
  const tree: HastRoot = {
    type: 'root',
    children: [{ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Plain' }] }],
  };
  const mdxFile = new VFile({ value: 'Plain', path: 'src/content/blog/demo.mdx' });
  mdxFile.data.astro = { frontmatter: { password: 'secret' } };
  await rehypeEncryptedPost()(tree, mdxFile);
  assert.equal(tree.children[0]?.type, 'element');
  if (tree.children[0]?.type === 'element') {
    assert.equal(tree.children[0].tagName, 'p');
  }

  const mdast: MdastRoot = {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] }],
  };
  const preprocessMdx = new VFile({ value: '+++note\nhi\n+++', path: 'post.mdx' });
  remarkShokaPreprocess({ enableContainers: true })(mdast, preprocessMdx);
  assert.equal(mdast.children[0]?.type, 'paragraph');
});

test('extractTextFromMarkdown strips MDX import/export and JSX comments', () => {
  const mdxBody = [
    "import Counter from '@components/Counter';",
    'export const meta = { draft: false };',
    '{/* internal comment */}',
    '',
    '## Overview',
    '',
    '<Counter client:load />',
    '',
    'Real paragraph content for summary generation.',
  ].join('\n');

  const extracted = extractTextFromMarkdown(mdxBody, 200);
  assert.doesNotMatch(extracted, /import Counter/);
  assert.doesNotMatch(extracted, /export const meta/);
  assert.doesNotMatch(extracted, /internal comment/);
  assert.match(extracted, /Overview/);
  assert.match(extracted, /Real paragraph content/);
});

test('buildRssItemFields populates non-empty RSS description and content for MDX posts without rendered.html', () => {
  const mockPost = {
    id: 'mdx-sample',
    collection: 'blog',
    filePath: 'src/content/blog/mdx-sample.mdx',
    body: ["import Alert from '@components/Alert.astro';", '', 'First MDX paragraph for RSS fallback extraction.'].join('\n'),
    data: {
      title: 'MDX Sample Post',
      date: new Date('2025-07-13'),
      tags: ['Astro', 'MDX'],
      categories: ['开发笔记'],
      draft: false,
    },
    rendered: undefined,
  } as unknown as BlogPost;

  const fields = buildPlainRssItemFields(mockPost);
  assert.equal(fields.title, 'MDX Sample Post');
  assert.match(fields.description, /First MDX paragraph/);
  assert.doesNotMatch(fields.description, /import Alert/);
  assert.match(fields.content, /^<p>.*First MDX paragraph.*<\/p>$/);
});
