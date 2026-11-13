# Koharu 上游同步指南

本仓库以版本化源码快照方式基于 [cosZone/astro-koharu](https://github.com/cosZone/astro-koharu) 维护，不合并上游 Git 历史。当前基线版本记录于根目录 [`.koharu-version`](../.koharu-version)。

## 本地定制边界

升级上游时重点保留以下本地改动，其余主题文件尽量跟随上游：

1. **站点与部署配置**：`config/site.yaml`、`vercel.json`（历史 `/posts/{hash}` 308 重定向，无 `api/` Serverless Functions）、`public/img/avatar.png`。
2. **原创内容与元数据**：`src/content/blog/*.mdx`、`src/pages/about.md`、`src/pages/music.md`、`src/assets/summaries.json`、`src/assets/similarities.json`、`src/assets/lqips.json`。
3. **MDX 适配层**：
   - `astro.config.mjs` 中的 `@astrojs/mdx` 集成注册；
   - `src/lib/markdown/mdx-utils.ts` 及 Shoka remark/rehype 插件对 `.mdx` 的隔离守卫；
   - `src/lib/content/post-source.ts`（禁止 `.mdx` 暴露 `.md` 原文端点）、`src/lib/rss-utils.ts`、`src/lib/sanitize.ts`；
   - `tests/mdx/` 与 `tests/migration/` 自动化测试，以及 `.github/workflows/build.yml`、`.github/dependabot.yml`。

## 升级步骤

1. 从 `main` 新建升级分支，例如 `git switch -c chore/koharu-v7.x.y`。
2. 拉取目标上游标签：
   ```bash
   git fetch https://github.com/cosZone/astro-koharu.git tag v7.x.y --no-tags
   ```
3. 查看与当前基线的差异，筛选需要应用的主题变更：
   ```bash
   git diff dc6e51b4ee04d6c26d4aae37b5c7940e30d2f572..FETCH_HEAD --stat
   ```
4. 使用 `git diff` 补丁或逐文件合入变更，跳过 `config/site.yaml`、`src/content/blog/`、已删除的 `api/` 等演示/Serverless 内容，并保留 MDX 隔离逻辑。
5. 更新 `.koharu-version` 中的 `tag`、`commit` 与 `synced_at`。
6. 运行完整验证后通过 PR 合并至 `main`：
   ```bash
   pnpm install
   pnpm check
   pnpm lint
   pnpm test:markdown
   pnpm test:index
   pnpm test:mdx
   pnpm test:migration
   pnpm build
   ```
