import navigationPlugin from "@11ty/eleventy-navigation";
import { getTranslatedUrl } from './utils/language-helper.js';

export default function(eleventyConfig) {
  // Register the custom filter for language switching with fallback support
  eleventyConfig.addNunjucksFilter('translatedUrl', function(currentUrl, currentLang) {
    return getTranslatedUrl(currentUrl, currentLang, this.ctx.collections.all);
  });

  // Plugins
  eleventyConfig.addPlugin(navigationPlugin);

  // Passthrough files
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Markdown table wrapper
  eleventyConfig.amendLibrary("md", (md) => {
    md.renderer.rules.table_open = () => '<div class="table-wrapper"><table>';
    md.renderer.rules.table_close = () => '</table></div>';
  });

  // URL path segments filter
  eleventyConfig.addFilter("pathSegments", (url) => {
    return url
      .replace(/^\/|\/$/g, "")
      .split("/")
      .filter(Boolean);
  });

  // Universal breadcrumb filter handling /hi/ anywhere in the path
  eleventyConfig.addFilter("generateBreadcrumbs", function(url, lang) {
    if (!url) return [];

    const cleanUrl = url.replace(/index\.html$/, "").replace(/\/$/, "");
    if (!cleanUrl) return [];

    const segments = cleanUrl.split("/").filter(Boolean);
    if (segments.length === 0) return [];

    const isHindi = lang === "hi" || segments.includes("hi");
    const homeUrl = segments[0] === "hi" ? "/hi/" : "/";
    const homeLabel = isHindi ? "होम" : "Home";

    if (cleanUrl === "" || cleanUrl === "/hi") return [];

    const crumbs = [
      { title: homeLabel, url: homeUrl, isLast: false }
    ];

    let accumulated = "";

    segments.forEach((segment, index) => {
      accumulated += `/${segment}`;
      const isLast = index === segments.length - 1;

      if (segment === "hi" && index === 0) return;

      let title = decodeURIComponent(segment).replace(/[-_]/g, " ");

      if (segment === "hi") {
        title = "हिंदी";
      }

      crumbs.push({
        title: title,
        url: `${accumulated}/`,
        isLast: isLast
      });
    });

    return crumbs;
  });

  // Facebook posts grouped by year
  eleventyConfig.addCollection("postsByYear", function(collectionApi) {
    const posts = collectionApi.getFilteredByTag("facebook");
    const years = {};

    posts.forEach((post) => {
      const year = post.data.year;
      if (!year) return;

      if (!years[year]) {
        years[year] = {
          year,
          posts: [],
          months: new Set()
        };
      }

      years[year].posts.push(post);

      if (post.data.month) {
        years[year].months.add(post.data.month);
      }
    });

    return Object.values(years)
      .map((yearData) => ({
        ...yearData,
        months: Array.from(yearData.months).sort().reverse()
      }))
      .sort((a, b) => b.year.localeCompare(a.year));
  });

  // Facebook posts grouped by month
  eleventyConfig.addCollection("postsByMonth", function(collectionApi) {
    const posts = collectionApi.getFilteredByTag("facebook");
    const months = {};

    posts.forEach((post) => {
      const year = post.data.year;
      const month = post.data.month;
      if (!year || !month) return;

      const key = `${year}-${month}`;

      if (!months[key]) {
        months[key] = {
          year,
          month,
          posts: []
        };
      }

      months[key].posts.push(post);
    });

    return Object.values(months).sort((a, b) => {
      const dateA = `${a.year}-${a.month}`;
      const dateB = `${b.year}-${b.month}`;
      return dateB.localeCompare(dateA);
    });
  });

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
