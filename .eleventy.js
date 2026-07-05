module.exports = function (eleventyConfig) {
  // Copy static assets straight through to the build output.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Collection of all recipes, sorted alphabetically by title.
  eleventyConfig.addCollection("recipes", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/recipes/*.md")
      .sort((a, b) => a.data.title.localeCompare(b.data.title));
  });

  // Sorted, de-duplicated list of every tag used across recipes.
  eleventyConfig.addCollection("recipeTags", (collectionApi) => {
    const tags = new Set();
    for (const item of collectionApi.getFilteredByGlob("src/recipes/*.md")) {
      for (const tag of item.data.tags || []) tags.add(tag);
    }
    return [...tags].sort();
  });

  return {
    // Site is served from https://<user>.github.io/recipes/ — this makes the
    // `url` filter prefix links correctly. Override via --pathprefix locally.
    pathPrefix: "/recipes/",
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
