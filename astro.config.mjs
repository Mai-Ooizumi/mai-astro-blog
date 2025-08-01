import { defineConfig } from "astro/config";

import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import swup from "@swup/astro";

import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkMath from "remark-math";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

import YukinaConfig from "./yukina.config";

import pagefind from "astro-pagefind";

import mdx from "@astrojs/mdx";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: YukinaConfig.site,

  integrations: [svelte(), icon(), swup({
    theme: false,
    containers: ["main", "footer", ".banner-inner"],
    smoothScrolling: true,
    progress: true,
    cache: true,
    preload: true,
    updateHead: true,
    updateBodyClass: false,
    globalInstance: true,
  }), sitemap(), pagefind(), mdx()],

  markdown: {
    shikiConfig: {
      theme: "catppuccin-mocha",
    },
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      rehypeKatex,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "prepend",
        },
      ],
    ],
  },

  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.maiooizumi.xyz",
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ["url/to/image"],
      },
    },
  },
});
