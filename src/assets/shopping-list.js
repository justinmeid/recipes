// Shopping-list builder: pick recipes, scale servings, get a combined list.
(function () {
  const app = document.querySelector(".shopping-app");
  if (!app) return;

  const STORAGE_KEY = "recipes-shopping-list-v1";
  const recipesUrl = app.dataset.recipesUrl;

  // ---- Persisted state -----------------------------------------------------
  // selected: { [slug]: targetServings }   checked: { [itemKey]: true }
  let state = { selected: {}, checked: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      state.selected = saved.selected || {};
      state.checked = saved.checked || {};
    }
  } catch (e) {
    /* ignore corrupt storage */
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage may be unavailable; the UI still works for the session */
    }
  }

  // ---- Quantity formatting -------------------------------------------------
  const GLYPHS = [
    [0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"], [0.375, "⅜"],
    [0.5, "½"], [0.625, "⅝"], [0.667, "⅔"], [0.75, "¾"], [0.875, "⅞"],
  ];

  function formatQty(n) {
    const rounded = Math.round(n * 1000) / 1000;
    const whole = Math.floor(rounded);
    const frac = rounded - whole;
    if (frac < 0.03) return String(whole);

    // Find the closest common fraction; fall back to a trimmed decimal.
    let best = null;
    let bestDiff = Infinity;
    for (const [value, glyph] of GLYPHS) {
      const diff = Math.abs(frac - value);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = glyph;
      }
    }
    if (bestDiff <= 0.04) {
      return whole > 0 ? `${whole} ${best}` : best;
    }
    // No clean fraction — show a tidy decimal.
    return String(Math.round(rounded * 100) / 100);
  }

  // ---- Aggregation ---------------------------------------------------------
  function buildList(recipes) {
    const combined = new Map(); // key -> { qty, unit, item }
    const toTaste = new Map(); // item(lower) -> item(display)

    for (const recipe of recipes) {
      const target = state.selected[recipe.slug];
      if (target == null) continue;
      const base = recipe.servings || 1;
      const factor = target / base;

      for (const ing of recipe.ingredients || []) {
        if (ing.qty == null) {
          toTaste.set(ing.item.toLowerCase().trim(), ing.item);
          continue;
        }
        const unit = (ing.unit || "").trim();
        const key = ing.item.toLowerCase().trim() + "|" + unit.toLowerCase();
        const scaled = ing.qty * factor;
        if (combined.has(key)) {
          combined.get(key).qty += scaled;
        } else {
          combined.set(key, { qty: scaled, unit, item: ing.item });
        }
      }
    }

    const items = [...combined.values()].sort((a, b) =>
      a.item.localeCompare(b.item)
    );
    return { items, toTaste: [...toTaste.values()].sort() };
  }

  // ---- Rendering -----------------------------------------------------------
  let recipes = [];

  function itemKey(entry) {
    return entry.item.toLowerCase().trim() + "|" + entry.unit.toLowerCase();
  }

  function render() {
    const { items, toTaste } = buildList(recipes);
    const selectedCount = Object.keys(state.selected).length;

    let listHtml;
    if (!selectedCount) {
      listHtml = `<p class="empty">Select some recipes to build your list.</p>`;
    } else {
      listHtml = `<ul class="list">`;
      for (const entry of items) {
        const key = itemKey(entry);
        const isChecked = !!state.checked[key];
        const qty = formatQty(entry.qty);
        const unit = entry.unit ? " " + entry.unit : "";
        listHtml += `
          <li>
            <input type="checkbox" class="list-check" data-key="${escapeAttr(key)}" ${isChecked ? "checked" : ""} />
            <span class="list-qty">${qty}${escapeHtml(unit)}</span>
            <span class="list-item ${isChecked ? "is-checked" : ""}">${escapeHtml(entry.item)}</span>
          </li>`;
      }
      listHtml += `</ul>`;

      if (toTaste.length) {
        listHtml += `<p class="list-subhead">To taste / as needed</p><ul class="list">`;
        for (const item of toTaste) {
          listHtml += `<li><span class="list-item">${escapeHtml(item)}</span></li>`;
        }
        listHtml += `</ul>`;
      }
    }

    app.innerHTML = `
      <div class="shopping-layout">
        <div class="panel picker-panel">
          <h2>Recipes</h2>
          <div class="picker-list"></div>
        </div>
        <div class="panel list-panel">
          <div class="list-actions">
            <h2 style="margin:0">Shopping list</h2>
            <button type="button" class="btn" id="clear-btn">Clear list</button>
          </div>
          ${listHtml}
        </div>
      </div>`;

    renderPicker();
    wireList();
  }

  function renderPicker() {
    const tpl = document.getElementById("tpl-recipe-picker");
    const container = app.querySelector(".picker-list");
    for (const recipe of recipes) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const check = node.querySelector(".picker-check");
      const title = node.querySelector(".picker-title");
      const scale = node.querySelector(".picker-scale");
      const servings = node.querySelector(".picker-servings");

      title.textContent = recipe.title;
      const selected = state.selected[recipe.slug] != null;
      check.checked = selected;
      scale.hidden = !selected;
      servings.value = selected ? state.selected[recipe.slug] : recipe.servings;

      check.addEventListener("change", () => {
        if (check.checked) {
          state.selected[recipe.slug] = recipe.servings;
        } else {
          delete state.selected[recipe.slug];
        }
        save();
        render();
      });

      servings.addEventListener("input", () => {
        const val = Math.max(1, parseInt(servings.value, 10) || recipe.servings);
        state.selected[recipe.slug] = val;
        save();
        // Re-render only the list side so the servings input keeps focus.
        updateListOnly();
      });

      container.appendChild(node);
    }
  }

  function updateListOnly() {
    const panel = app.querySelector(".list-panel");
    const { items, toTaste } = buildList(recipes);
    const selectedCount = Object.keys(state.selected).length;

    let listHtml = `
      <div class="list-actions">
        <h2 style="margin:0">Shopping list</h2>
        <button type="button" class="btn" id="clear-btn">Clear list</button>
      </div>`;

    if (!selectedCount) {
      listHtml += `<p class="empty">Select some recipes to build your list.</p>`;
    } else {
      listHtml += `<ul class="list">`;
      for (const entry of items) {
        const key = itemKey(entry);
        const isChecked = !!state.checked[key];
        const qty = formatQty(entry.qty);
        const unit = entry.unit ? " " + entry.unit : "";
        listHtml += `
          <li>
            <input type="checkbox" class="list-check" data-key="${escapeAttr(key)}" ${isChecked ? "checked" : ""} />
            <span class="list-qty">${qty}${escapeHtml(unit)}</span>
            <span class="list-item ${isChecked ? "is-checked" : ""}">${escapeHtml(entry.item)}</span>
          </li>`;
      }
      listHtml += `</ul>`;
      if (toTaste.length) {
        listHtml += `<p class="list-subhead">To taste / as needed</p><ul class="list">`;
        for (const item of toTaste) {
          listHtml += `<li><span class="list-item">${escapeHtml(item)}</span></li>`;
        }
        listHtml += `</ul>`;
      }
    }
    panel.innerHTML = listHtml;
    wireList();
  }

  function wireList() {
    const clearBtn = app.querySelector("#clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        state = { selected: {}, checked: {} };
        save();
        render();
      });
    }
    app.querySelectorAll(".list-check").forEach((box) => {
      box.addEventListener("change", () => {
        const key = box.dataset.key;
        if (box.checked) state.checked[key] = true;
        else delete state.checked[key];
        save();
        updateListOnly();
      });
    });
  }

  // ---- Helpers -------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  // ---- Boot ----------------------------------------------------------------
  fetch(recipesUrl)
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      recipes = data;
      // Drop any saved selections for recipes that no longer exist.
      const slugs = new Set(recipes.map((r) => r.slug));
      for (const slug of Object.keys(state.selected)) {
        if (!slugs.has(slug)) delete state.selected[slug];
      }
      render();
    })
    .catch((err) => {
      app.innerHTML = `<p class="empty">Couldn't load recipes (${escapeHtml(err.message)}).</p>`;
    });
})();
