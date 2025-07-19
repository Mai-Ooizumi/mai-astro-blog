import { toString as mdastToString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = mdastToString(tree);
    const readingTime = getReadingTime(textOnPage);

    // 设置两种格式以保持兼容性
    data.astro.frontmatter.readingMetadata = {
      time: Math.max(1, Math.round(readingTime.minutes)),
      wordCount: readingTime.words,
    };

    // 保持向后兼容
    data.astro.frontmatter.minutes = Math.max(
      1,
      Math.round(readingTime.minutes),
    );
    data.astro.frontmatter.words = readingTime.words;
  };
}
