// Directory data: applies to every recipe Markdown file in src/recipes/.
module.exports = {
  layout: "layouts/recipe.njk",
  eleventyComputed: {
    // slug derived from the filename, e.g. chicken-parmesan.md -> "chicken-parmesan"
    slug: (data) => data.page.fileSlug,
    permalink: (data) => `/recipes/${data.page.fileSlug}/`,
  },
};
