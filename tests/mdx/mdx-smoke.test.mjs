import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const ASTRO_CLI = path.join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs');

function writeFixtureFiles(rootDir, outDir, cacheDir, { broken = false } = {}) {
  const srcDir = path.join(rootDir, 'src');
  fs.mkdirSync(path.join(srcDir, 'components'), { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'pages'), { recursive: true });

  const toImportUrl = (relPath) => pathToFileURL(path.join(ROOT, relPath)).href;

  fs.writeFileSync(
    path.join(rootDir, 'astro.config.mjs'),
    `import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import { rehypeEncryptedBlock } from '${toImportUrl('src/lib/markdown/rehype-encrypted-block.ts')}';
import { rehypeEncryptedPost } from '${toImportUrl('src/lib/markdown/rehype-encrypted-post.ts')}';
import { rehypeShokaAttrs } from '${toImportUrl('src/lib/markdown/rehype-shoka-attrs.ts')}';
import { remarkEncryptedDirective } from '${toImportUrl('src/lib/markdown/remark-encrypted-directive.ts')}';
import { remarkLiteralDirectives } from '${toImportUrl('src/lib/markdown/remark-literal-directives.ts')}';
import { remarkIns, remarkMark } from '${toImportUrl('src/lib/markdown/remark-shoka-effects.ts')}';
import { remarkShokaPreprocess } from '${toImportUrl('src/lib/markdown/remark-shoka-preprocess.ts')}';
import { remarkShokaRuby } from '${toImportUrl('src/lib/markdown/remark-shoka-ruby.ts')}';
import { remarkShokaSpoiler } from '${toImportUrl('src/lib/markdown/remark-shoka-spoiler.ts')}';
import { collapsibleCodeTransformer } from '${toImportUrl('src/lib/markdown/shiki-collapsible-transformer.ts')}';
import { shokaMetaTransformer } from '${toImportUrl('src/lib/markdown/shiki-meta-transformer.ts')}';
import { SHIKI_THEMES } from '${toImportUrl('src/lib/markdown/shiki-themes.ts')}';

export default defineConfig({
  outDir: ${JSON.stringify(outDir)},
  cacheDir: ${JSON.stringify(cacheDir)},
  output: 'static',
  integrations: [react(), mdx()],
  markdown: {
    processor: unified({
      gfm: true,
      remarkPlugins: [
        [
          remarkShokaPreprocess,
          {
            enableContainers: true,
            enableHexoTags: true,
            enableSuperSub: true,
            enableMath: true,
            enableEncryptedBlock: true,
          },
        ],
        remarkMath,
        remarkShokaSpoiler,
        remarkShokaRuby,
        remarkIns,
        remarkMark,
        remarkDirective,
        remarkLiteralDirectives,
        remarkEncryptedDirective,
      ],
      rehypePlugins: [
        rehypeSlug,
        rehypeShokaAttrs,
        rehypeKatex,
        rehypeEncryptedBlock,
        rehypeEncryptedPost,
      ],
    }),
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    shikiConfig: {
      themes: SHIKI_THEMES,
      transformers: [shokaMetaTransformer(), collapsibleCodeTransformer()],
    },
  },
});
`,
  );

  fs.writeFileSync(
    path.join(srcDir, 'components', 'MdxBox.astro'),
    `---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<div data-mdx-box={title}><slot /></div>
`,
  );

  fs.writeFileSync(
    path.join(srcDir, 'components', 'MdxCounter.tsx'),
    `import { useState } from 'react';

export function MdxCounter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  );
}
`,
  );

  const pageContent = broken
    ? `---
title: Broken MDX
---

# Broken

<UnclosedComponent
`
    : `---
title: MDX Smoke Test
---
import MdxBox from '../components/MdxBox.astro';
import { MdxCounter } from '../components/MdxCounter';

# MDX Smoke Heading

Regular prose with **bold**, math $E = mc^2$, and expression sum {2 + 3}. Literal Shoka-like tokens ++not-ins++ and !!not-spoiler!! remain intact.

\`\`\`ts title="smoke.ts"
const answer: number = 42;
\`\`\`

<MdxBox title="Fixture">
  Inside Astro component
</MdxBox>

<MdxCounter client:load initial={7} />
`;

  fs.writeFileSync(path.join(srcDir, 'pages', 'smoke.mdx'), pageContent);
}

async function runAstroBuild(rootDir) {
  return execFileAsync(process.execPath, [ASTRO_CLI, 'build', '--root', rootDir, '--silent'], {
    cwd: ROOT,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NODE_ENV: 'production' },
  });
}

test('Astro + @astrojs/mdx builds prose, Shiki, KaTeX, Astro component, and React island cleanly', async () => {
  const workspaceTmpParent = path.join(ROOT, '.astro');
  fs.mkdirSync(workspaceTmpParent, { recursive: true });
  const fixtureRoot = fs.mkdtempSync(path.join(workspaceTmpParent, 'mdx-smoke-'));
  const outDir = path.join(os.tmpdir(), `koharu-mdx-out-${process.pid}-${Date.now()}`);
  const cacheDir = path.join(os.tmpdir(), `koharu-mdx-cache-${process.pid}-${Date.now()}`);

  try {
    writeFixtureFiles(fixtureRoot, outDir, cacheDir);
    await runAstroBuild(fixtureRoot);

    const htmlPath = path.join(outDir, 'smoke', 'index.html');
    assert.equal(fs.existsSync(htmlPath), true, 'smoke/index.html must be emitted');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /MDX Smoke Heading/);
    assert.match(html, /class="astro-code/);
    assert.match(html, /data-title="smoke\.ts"/);
    assert.match(html, /class="katex"/);
    assert.match(html, /expression sum 5/);
    assert.doesNotMatch(html, /<ins>not-ins<\/ins>/);
    assert.doesNotMatch(html, /<spoiler-span>/);
    assert.match(html, /data-mdx-box="Fixture"/);
    assert.match(html, /Inside Astro component/);
    assert.match(html, /<astro-island[^>]*client="load"/);
    assert.match(html, /Count:.*7/);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test('Astro + @astrojs/mdx rejects malformed MDX syntax instead of silently degrading', async () => {
  const workspaceTmpParent = path.join(ROOT, '.astro');
  fs.mkdirSync(workspaceTmpParent, { recursive: true });
  const fixtureRoot = fs.mkdtempSync(path.join(workspaceTmpParent, 'mdx-broken-'));
  const outDir = path.join(os.tmpdir(), `koharu-mdx-broken-out-${process.pid}-${Date.now()}`);
  const cacheDir = path.join(os.tmpdir(), `koharu-mdx-broken-cache-${process.pid}-${Date.now()}`);

  try {
    writeFixtureFiles(fixtureRoot, outDir, cacheDir, { broken: true });
    await assert.rejects(() => runAstroBuild(fixtureRoot));
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});
