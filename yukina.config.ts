import I18nKeys from "./src/locales/keys";
import type { Configuration } from "./src/types/config";

const YukinaConfig: Configuration = {
  title: "Mai's Blog",
  subTitle: "",
  brandTitle: "Mai's Blog",
  description: "Mai Ooizumi 的个人博客",

  site: "https://maiooizumi.xyz/",

  locale: "zh-CN", // set for website language and date format

  navigators: [
    {
      nameKey: I18nKeys.nav_bar_home,
      href: "/",
    },
    {
      nameKey: I18nKeys.nav_bar_archive,
      href: "/archive",
    },
    {
      nameKey: I18nKeys.nav_bar_about,
      href: "/about",
    },
    {
      nameKey: I18nKeys.nav_bar_projects,
      href: "/projects",
    },
    {
      nameKey: I18nKeys.nav_bar_links,
      href: "/links",
    },
  ],

  username: "Mai Ooizumi",
  sign: "",
  avatarUrl: "assets/images/avatar_10705767.png",
  socialLinks: [
    {
      icon: "line-md:github-loop",
      link: "https://github.com/Mai-Ooizumi",
    },
    {
      icon: "line-md:mastodon",
      link: "https://mastodon.social/@Mai_Ooizumi",
    },
    {
      icon: "line-md:telegram",
      link: "https://t.me/Mai_Ooizumi",
    },
    {
      icon: "line-md:discord",
      link: "https://discord.com/users/390817609739665409",
    },
    {
      icon: "mdi:steam",
      link: "https://steamcommunity.com/profiles/76561198080038715"
    },

  ],
  maxSidebarCategoryChip: 6, // It is recommended to set it to a common multiple of 2 and 3
  maxSidebarTagChip: 12,
  maxFooterCategoryChip: 6,
  maxFooterTagChip: 24,

  banners: [
    "assets/images/background/PBvHFjr5yDu6t4a.webp",
    "assets/images/background/6bKcwHZigzlM4mJ.webp",
    "assets/images/background/H9WgEK6qNTcpFiS.webp",
    "assets/images/background/njNVtuUMzxs81RI.webp",
    "assets/images/background/tozsJ8QHAjFN3Mm.webp",
    "assets/images/background/Pm89OveZq7NWUxF.webp",
    "assets/images/background/UCYKvc1ZhgPHB9m.webp",
    "assets/images/background/JjpLOW8VSmufzlA.webp",
  ],

  slugMode: "HASH", // 'RAW' | 'HASH'

  license: {
    name: "CC BY-NC-SA 4.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },

  // WIP functions
  bannerStyle: "LOOP", // 'loop' | 'static' | 'hidden'
};

export default YukinaConfig;
