# Our Recipes

A clean, easy-to-read recipe site with a **shopping-list builder** — pick the recipes
you're cooking, scale the servings, and get one combined list of everything to buy.
Built with [Eleventy](https://www.11ty.dev/) and hosted on GitHub Pages.

## Add a recipe

The easy path: paste the raw recipe into `recipe-examples/` and ask Claude to convert it —
it fills in structured ingredients, prep/cook time, a health rating, and estimated macros.
See **[ADDING-RECIPES.md](ADDING-RECIPES.md)** for the full flow and the health/macro rubric.

To do it by hand, copy `src/recipes/_TEMPLATE.md` to a new file (the filename becomes the
URL) and fill in the frontmatter. Ingredients are **structured** so the shopping list can
combine and scale them:
- `qty` — a number, or `null` for "to taste" (never scaled or combined)
- `unit` — `"cup"`, `"tbsp"`, `"clove"`, `"lb"`, … or `""` for countable items
- `item` — the ingredient name; keep names consistent across recipes so they combine

Then commit and push — GitHub Actions rebuilds and deploys automatically.

## Run locally

```bash
npm install
npm start          # serves at http://localhost:8080/recipes/
```

`npm run build` outputs the static site to `_site/`.

## Deploy (one-time setup)

In the GitHub repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
After that, every push to `main` builds and deploys via `.github/workflows/deploy.yml`.

> The site is served from `/recipes/` (the repo name), set as `pathPrefix` in
> `.eleventy.js`. If you rename the repo, update that value to match.
