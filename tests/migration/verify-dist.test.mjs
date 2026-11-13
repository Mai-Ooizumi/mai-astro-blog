import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

const ORIGINAL_POSTS = [
  { slug: 'blog-rebuild-plan', hash: '4a8fadf6', title: '从 Typecho 到 Astro：博客重建之旅' },
  { slug: 'discord-bot-create', hash: 'a6467b62', title: 'Discord Bot 开发与部署' },
  { slug: 'docker-rustdesk-aliyun', hash: '0b996832', title: '阿里云 Docker 镜像源导致 RustDesk 服务异常' },
  { slug: 'windows11-bbr2-issue', hash: '26bf597b', title: 'Windows 11 BBR2 网络优化指南：收益与隐患' },
];

const DEMO_SLUGS = ['hello-world', 'getting-started', 'astro-koharu-guide', 'markdown-features', 'weekly-example-1'];

test('pure static configuration: no api/ serverless directory and Vercel 308 redirects match legacy post hashes', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'api')), false, 'api/ directory must be removed');

  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(vercel.functions, undefined, 'vercel.json must not declare serverless functions');
  assert.ok(Array.isArray(vercel.redirects), 'vercel.json must configure redirects');

  for (const post of ORIGINAL_POSTS) {
    const match = vercel.redirects.find(
      (rule) => rule.source === `/posts/${post.hash}` && rule.destination === `/post/${post.slug}` && rule.permanent === true,
    );
    assert.ok(match, `Missing permanent redirect /posts/${post.hash} -> /post/${post.slug}`);
  }
});

test('dist contains only the 4 original posts, required routes/SEO outputs, and omits MDX .md endpoints & demo routes', () => {
  assert.equal(fs.existsSync(DIST), true, 'dist/ must exist before running verify-dist');

  const requiredFiles = [
    'index.html',
    '404.html',
    'about/index.html',
    'archives/index.html',
    'categories/index.html',
    'categories/dev-notes/index.html',
    'categories/ops/index.html',
    'tags/index.html',
    'rss.xml',
    'sitemap-index.xml',
    'robots.txt',
    'img/avatar.png',
    'pagefind/pagefind.js',
  ];

  for (const rel of requiredFiles) {
    assert.equal(fs.existsSync(path.join(DIST, rel)), true, `Missing dist/${rel}`);
  }

  for (const post of ORIGINAL_POSTS) {
    const htmlFile = path.join(DIST, 'post', post.slug, 'index.html');
    assert.equal(fs.existsSync(htmlFile), true, `Missing dist/post/${post.slug}/index.html`);

    const html = fs.readFileSync(htmlFile, 'utf8');
    assert.match(html, new RegExp(post.title));
    assert.match(html, new RegExp(`https://maiooizumi\\.xyz/post/${post.slug}`));
    assert.match(html, /CC BY-NC-SA 4\.0/);
    assert.match(html, /astro-koharu/);

    const mdFile = path.join(DIST, 'post', `${post.slug}.md`);
    assert.equal(fs.existsSync(mdFile), false, `.mdx post ${post.slug} must not emit .md source endpoint`);
  }

  for (const forbiddenDir of ['en', 'ja', 'ko', 'editor', 'weekly', 'moments']) {
    assert.equal(fs.existsSync(path.join(DIST, forbiddenDir)), false, `Forbidden dist/${forbiddenDir} route exists`);
  }

  const bangumiHtml = fs.readFileSync(path.join(DIST, 'bangumi', 'index.html'), 'utf8');
  assert.match(bangumiHtml, /url=\/404/);
  assert.match(bangumiHtml, /name="robots" content="noindex"/);

  for (const demoSlug of DEMO_SLUGS) {
    assert.equal(fs.existsSync(path.join(DIST, 'post', demoSlug)), false, `Demo post dist/post/${demoSlug} must not exist`);
  }

  const rssXml = fs.readFileSync(path.join(DIST, 'rss.xml'), 'utf8');
  for (const post of ORIGINAL_POSTS) {
    assert.match(rssXml, new RegExp(`https://maiooizumi\\.xyz/post/${post.slug}`));
    assert.match(rssXml, new RegExp(post.title));
  }
  assert.doesNotMatch(rssXml, /koharu\.cosine\.ren|blog\.cosine\.ren/);
});

test('AGPL-3.0 LICENSE remains intact in repository root', () => {
  const license = fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8');
  assert.match(license, /GNU AFFERO GENERAL PUBLIC LICENSE/);
});
