# Adding recipes

A repeatable flow for turning a copied-and-pasted recipe into a clean recipe page,
with health and macro info filled in.

## The flow

1. **Drop the raw recipe in `recipe-examples/`.** Paste whatever you copied — from a blog,
   a cookbook photo, a screenshot's text, anything — into a new `.md` file there. Format
   doesn't matter; messy is fine.
2. **Ask Claude to convert it.** Say something like:
   > "Convert the new recipe in `recipe-examples/` into the site format."
   Claude will:
   - Restructure it into `src/recipes/<slug>.md` using the format in `_TEMPLATE.md`.
   - Break ingredients into structured `{ qty, unit, item }` so the shopping list can
     combine and scale them, reusing existing item names where possible.
   - Fill in `servings`, `prep`, and `cook` from the source (or estimate if missing).
   - **Estimate macros** per serving and assign a **health rating** with a one-line note
     (rubric below).
   - Clean up the instructions into numbered steps.
3. **Review & tweak.** Skim the result — especially the macro estimates and health note —
   and adjust anything you disagree with. These are estimates, not lab values.
4. **Commit & push.** GitHub Actions rebuilds and deploys automatically.

Once a raw file has been converted you can delete it from `recipe-examples/` — the real
recipe now lives in `src/recipes/`.

## Health rating rubric (1–5)

A quick "how nourishing is a normal portion," weighing lean protein, vegetables, and whole
grains against refined carbs, added sugar, saturated fat, and frying.

| Score | Meaning | Examples |
|------:|---------|----------|
| **5** | Lean protein + lots of veg/whole grains; minimal added sugar, refined carbs, or saturated fat. | Salmon Bowl, Thai Peanut Chicken |
| **4** | Mostly whole foods with one small caveat (a bit of honey, some red meat, higher sodium). | Turmeric Chicken, Crispy Chickpeas |
| **3** | Balanced but with notable refined carbs, cream, cheese, or a fatty sauce. | Chicken & Rice, Creamy Orzo |
| **2** | Heavy on refined carbs, saturated fat, or fried components; light on veg. | — |
| **1** | Indulgent / dessert-like; occasional treat. | — |

Keep `health_note` to one honest sentence: what's good, and the main thing to watch.

## Macro estimates

Macros are **per serving** and **estimated** (the site labels them that way). Approach:

- If the source lists calories, use that and estimate the protein/carbs/fat split around it.
- Otherwise, sum the main contributors (protein, grains, oils/fats, sauces) and divide by
  `servings`. A sanity check: `protein×4 + carbs×4 + fat×9` should land near the calorie
  number.
- Round to sensible whole numbers. Include `fiber` when it's meaningful (legumes, veg,
  whole grains).

## Keeping the shopping list smart

The shopping list combines ingredients by matching `item` **name + unit**. So:

- Use consistent names across recipes: always `"garlic"` in `clove`, `"olive oil"` in
  `tbsp`, `"lime"` as a countable item, etc.
- Put unquantifiable things (`"salt & pepper to taste"`) as `qty: null` — they're listed
  under "to taste" and never scaled or summed.
