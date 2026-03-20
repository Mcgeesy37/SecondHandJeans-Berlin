// assets/js/app.js
(() => {
  "use strict";

  /**
   * Demo-Inventar:
   * - Für die Vorschau generieren wir 50 Artikel.
   * - Später ersetzt ihr das durch echte Daten (CSV/Sheet -> JSON).
   */

  const INVENTORY = generateDemoInventory(50);

  const state = {
    q: "",
    brand: "all",
    waist: "all",
    length: "all",
    fit: "all",
    color: "all",
    condition: "all",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
    page: 1,
    pageSize: 24,
    filtered: [],
  };

  const el = {
    year: document.getElementById("year"),
    statTotal: document.getElementById("statTotal"),
    statBrands: document.getElementById("statBrands"),
    brandCountPill: document.getElementById("brandCountPill"),

    q: document.getElementById("q"),
    brand: document.getElementById("brand"),
    waist: document.getElementById("waist"),
    length: document.getElementById("length"),
    fit: document.getElementById("fit"),
    color: document.getElementById("color"),
    condition: document.getElementById("condition"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
    sort: document.getElementById("sort"),

    applyBtn: document.getElementById("applyBtn"),
    resetBtn: document.getElementById("resetBtn"),
    grid: document.getElementById("grid"),
    resultsCount: document.getElementById("resultsCount"),
    resultsTitle: document.getElementById("resultsTitle"),
    resultMeta: document.getElementById("resultMeta"),
    pageMeta: document.getElementById("pageMeta"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),

    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),

    brandsBtn: document.getElementById("brandsBtn"),
    brandsDialog: document.getElementById("brandsDialog"),
    closeBrands: document.getElementById("closeBrands"),
    brandsList: document.getElementById("brandsList"),

    productDialog: document.getElementById("productDialog"),
    closeProduct: document.getElementById("closeProduct"),

    pdTitle: document.getElementById("pdTitle"),
    pdSub: document.getElementById("pdSub"),
    pdPrice: document.getElementById("pdPrice"),
    pdCondition: document.getElementById("pdCondition"),
    pdSize: document.getElementById("pdSize"),
    pdFit: document.getElementById("pdFit"),
    pdColor: document.getElementById("pdColor"),
    pdWaist: document.getElementById("pdWaist"),
    pdInseam: document.getElementById("pdInseam"),
    pdRise: document.getElementById("pdRise"),
    pdLeg: document.getElementById("pdLeg"),
    pdNotes: document.getElementById("pdNotes"),
    pdMail: document.getElementById("pdMail"),
    pdCopy: document.getElementById("pdCopy"),

    openFiltersBtn: document.getElementById("openFiltersBtn"),
    filtersDrawer: document.getElementById("filtersDrawer"),
    closeFilters: document.getElementById("closeFilters"),
    drawerMount: document.getElementById("drawerMount"),
  };

  boot();

  function boot() {
    if (el.year) el.year.textContent = String(new Date().getFullYear());

    wireNav();
    setupFilterOptions(INVENTORY);
    setupStats(INVENTORY);
    setupBrandsDialog(INVENTORY);

    wireFilters();
    applyAndRender(true);

    wirePagination();
    wireProductDialog();
    wireMobileFilters();
  }

  function wireNav() {
    if (!el.navToggle) return;
    el.navToggle.addEventListener("click", () => {
      const isOpen = el.navMenu.classList.toggle("is-open");
      el.navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function wireFilters() {
    const onEnter = (e) => {
      if (e.key === "Enter") applyAndRender(true);
    };

    el.q.addEventListener("keydown", onEnter);

    el.applyBtn.addEventListener("click", () => applyAndRender(true));
    el.resetBtn.addEventListener("click", () => {
      state.q = "";
      state.brand = "all";
      state.waist = "all";
      state.length = "all";
      state.fit = "all";
      state.color = "all";
      state.condition = "all";
      state.minPrice = "";
      state.maxPrice = "";
      state.sort = "newest";
      state.page = 1;

      syncInputsFromState();
      applyAndRender(true);
    });

    const softApply = () => applyAndRender(true);

    el.brand.addEventListener("change", softApply);
    el.waist.addEventListener("change", softApply);
    el.length.addEventListener("change", softApply);
    el.fit.addEventListener("change", softApply);
    el.color.addEventListener("change", softApply);
    el.condition.addEventListener("change", softApply);
    el.sort.addEventListener("change", softApply);

    el.minPrice.addEventListener("change", softApply);
    el.maxPrice.addEventListener("change", softApply);
  }

  function wirePagination() {
    el.prevPage.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderGrid();
    });
    el.nextPage.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      state.page = Math.min(totalPages, state.page + 1);
      renderGrid();
    });
  }

  function wireProductDialog() {
    el.closeProduct.addEventListener("click", () => el.productDialog.close());
    el.productDialog.addEventListener("click", (e) => {
      if (e.target === el.productDialog) el.productDialog.close();
    });

    el.pdCopy.addEventListener("click", async () => {
      const code = el.pdCopy.getAttribute("data-code") || "";
      try {
        await navigator.clipboard.writeText(code);
        el.pdCopy.textContent = "Kopiert ✓";
        setTimeout(() => (el.pdCopy.textContent = "Artikelcode kopieren"), 900);
      } catch {
        el.pdCopy.textContent = "Nicht möglich";
        setTimeout(() => (el.pdCopy.textContent = "Artikelcode kopieren"), 900);
      }
    });
  }

  function wireMobileFilters() {
    if (!el.filtersDrawer) return;

    el.openFiltersBtn.addEventListener("click", () => {
      mountFiltersIntoDrawer();
      el.filtersDrawer.showModal();
    });

    el.closeFilters.addEventListener("click", () => el.filtersDrawer.close());
    el.filtersDrawer.addEventListener("click", (e) => {
      if (e.target === el.filtersDrawer) el.filtersDrawer.close();
    });
  }

  function mountFiltersIntoDrawer() {
    el.drawerMount.innerHTML = "";

    const clone = document.querySelector(".filters")?.cloneNode(true);
    if (!clone) return;

    clone.style.display = "block";
    clone.style.position = "relative";
    clone.style.top = "auto";

    el.drawerMount.appendChild(clone);

    const map = {
      q: "q",
      brand: "brand",
      waist: "waist",
      length: "length",
      fit: "fit",
      color: "color",
      condition: "condition",
      minPrice: "minPrice",
      maxPrice: "maxPrice",
      sort: "sort",
    };

    const get = (id) => clone.querySelector(`#${id}`);

    const setFromState = () => {
      get("q").value = state.q;
      get("brand").value = state.brand;
      get("waist").value = state.waist;
      get("length").value = state.length;
      get("fit").value = state.fit;
      get("color").value = state.color;
      get("condition").value = state.condition;
      get("minPrice").value = state.minPrice;
      get("maxPrice").value = state.maxPrice;
      get("sort").value = state.sort;
    };

    setFromState();

    Object.keys(map).forEach((key) => {
      const id = map[key];
      const node = get(id);
      if (!node) return;
      node.addEventListener("change", () => {});
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.preventDefault();
      });
    });

    const applyBtn = clone.querySelector("#applyBtn");
    const resetBtn = clone.querySelector("#resetBtn");

    applyBtn.addEventListener("click", () => {
      state.q = get("q").value.trim();
      state.brand = get("brand").value;
      state.waist = get("waist").value;
      state.length = get("length").value;
      state.fit = get("fit").value;
      state.color = get("color").value;
      state.condition = get("condition").value;
      state.minPrice = get("minPrice").value.trim();
      state.maxPrice = get("maxPrice").value.trim();
      state.sort = get("sort").value;
      state.page = 1;

      syncInputsFromState();
      applyAndRender(true);
      el.filtersDrawer.close();
    });

    resetBtn.addEventListener("click", () => {
      state.q = "";
      state.brand = "all";
      state.waist = "all";
      state.length = "all";
      state.fit = "all";
      state.color = "all";
      state.condition = "all";
      state.minPrice = "";
      state.maxPrice = "";
      state.sort = "newest";
      state.page = 1;

      syncInputsFromState();
      applyAndRender(true);
      el.filtersDrawer.close();
    });
  }

  function setupStats(items) {
    const brands = new Set(items.map((x) => x.brand));
    el.statTotal.textContent = String(items.length);
    el.statBrands.textContent = String(brands.size);
    el.brandCountPill.textContent = String(brands.size);
  }

  function setupBrandsDialog(items) {
    const counts = countBy(items, (x) => x.brand);
    const rows = Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0], "de"))
      .map(([brand, count]) => ({ brand, count }));

    el.brandsBtn.addEventListener("click", () => el.brandsDialog.showModal());
    el.closeBrands.addEventListener("click", () => el.brandsDialog.close());
    el.brandsDialog.addEventListener("click", (e) => {
      if (e.target === el.brandsDialog) el.brandsDialog.close();
    });

    el.brandsList.innerHTML = "";
    for (const row of rows) {
      const btn = document.createElement("button");
      btn.className = "brand-chip";
      btn.type = "button";
      btn.innerHTML = `<b>${escapeHtml(row.brand)}</b><span>${row.count}</span>`;
      btn.addEventListener("click", () => {
        state.brand = row.brand;
        state.page = 1;
        syncInputsFromState();
        applyAndRender(true);
        el.brandsDialog.close();
        document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
      });
      el.brandsList.appendChild(btn);
    }
  }

  function setupFilterOptions(items) {
    fillSelect(el.brand, ["all", ...uniqueSorted(items.map((x) => x.brand))], "Alle Marken");
    fillSelect(el.waist, ["all", ...uniqueSorted(items.map((x) => x.sizeW))], "Alle W");
    fillSelect(el.length, ["all", ...uniqueSorted(items.map((x) => x.sizeL))], "Alle L");
    fillSelect(el.fit, ["all", ...uniqueSorted(items.map((x) => x.fit))], "Alle Fits");
    fillSelect(el.color, ["all", ...uniqueSorted(items.map((x) => x.color))], "Alle Farben");
    fillSelect(el.condition, ["all", ...uniqueSorted(items.map((x) => x.condition))], "Alle Zustände");

    syncInputsFromState();
  }

  function syncInputsFromState() {
    el.q.value = state.q;
    el.brand.value = state.brand;
    el.waist.value = state.waist;
    el.length.value = state.length;
    el.fit.value = state.fit;
    el.color.value = state.color;
    el.condition.value = state.condition;
    el.minPrice.value = state.minPrice;
    el.maxPrice.value = state.maxPrice;
    el.sort.value = state.sort;
  }

  function applyAndRender(resetToFirstPage) {
    state.q = el.q.value.trim();
    state.brand = el.brand.value;
    state.waist = el.waist.value;
    state.length = el.length.value;
    state.fit = el.fit.value;
    state.color = el.color.value;
    state.condition = el.condition.value;
    state.minPrice = el.minPrice.value.trim();
    state.maxPrice = el.maxPrice.value.trim();
    state.sort = el.sort.value;

    if (resetToFirstPage) state.page = 1;

    const filtered = INVENTORY.filter(matchesFilters);
    const sorted = sortItems(filtered, state.sort);

    state.filtered = sorted;

    updateMeta();
    renderGrid();
  }

  function updateMeta() {
    el.resultsCount.textContent = String(state.filtered.length);
    const title = state.brand !== "all" ? `Jeans von ${state.brand}` : "Alle Jeans";
    el.resultsTitle.textContent = title;

    const f = [];
    if (state.waist !== "all") f.push(`W${state.waist}`);
    if (state.length !== "all") f.push(`L${state.length}`);
    if (state.fit !== "all") f.push(state.fit);
    if (state.color !== "all") f.push(state.color);
    if (state.condition !== "all") f.push(state.condition);
    if (state.minPrice) f.push(`min €${state.minPrice}`);
    if (state.maxPrice) f.push(`max €${state.maxPrice}`);
    el.resultMeta.textContent = f.length ? `Aktive Filter: ${f.join(" · ")}` : "Keine Filter aktiv";
  }

  function renderGrid() {
    el.grid.innerHTML = "";

    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = clamp(state.page, 1, totalPages);

    const start = (state.page - 1) * state.pageSize;
    const end = Math.min(total, start + state.pageSize);
    const slice = state.filtered.slice(start, end);

    for (const item of slice) {
      const card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${item.brand} ${item.model} öffnen`);
      card.innerHTML = `
        <div class="card-top">
          <div class="card-code">${escapeHtml(item.code)}</div>
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(item.brand)} · ${escapeHtml(item.model)}</div>
          <div class="card-sub">
            <span>W${escapeHtml(item.sizeW)} / L${escapeHtml(item.sizeL)}</span>
            <span>${escapeHtml(item.fit)}</span>
            <span>${escapeHtml(item.color)}</span>
          </div>
          <div class="card-price">
            <div class="price">€${escapeHtml(String(item.price))}</div>
            <div class="tag">${escapeHtml(item.condition)}</div>
          </div>
        </div>
      `;

      const open = () => openProduct(item);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });

      el.grid.appendChild(card);
    }

    el.pageMeta.textContent = `Seite ${state.page} von ${totalPages} · ${start + 1}-${end} von ${total || 0}`;
    el.prevPage.disabled = state.page <= 1;
    el.nextPage.disabled = state.page >= totalPages;

    if (total === 0) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.style.padding = "14px 6px";
      empty.textContent = "Keine Treffer. Entferne Filter oder ändere die Suche.";
      el.grid.appendChild(empty);
      el.pageMeta.textContent = "–";
    }
  }

  function openProduct(item) {
    el.pdTitle.textContent = `${item.brand} · ${item.model}`;
    el.pdSub.textContent = `${item.code} · W${item.sizeW}/L${item.sizeL} · ${item.fit}`;
    el.pdPrice.textContent = `€${String(item.price)}`;
    el.pdCondition.textContent = item.condition;

    el.pdSize.textContent = `W${item.sizeW} / L${item.sizeL}`;
    el.pdFit.textContent = item.fit;
    el.pdColor.textContent = item.color;

    el.pdWaist.textContent = `${item.measurements.waistCm}`;
    el.pdInseam.textContent = `${item.measurements.inseamCm}`;
    el.pdRise.textContent = `${item.measurements.riseCm}`;
    el.pdLeg.textContent = `${item.measurements.legOpeningCm}`;

    el.pdNotes.textContent = item.notes;

    const subject = encodeURIComponent(`Anfrage Jeans ${item.code} (${item.brand} ${item.model})`);
    const body = encodeURIComponent(
      `Hi,\n\nich interessiere mich für ${item.brand} ${item.model} (${item.code}).\n` +
      `Größe: W${item.sizeW}/L${item.sizeL}\nPreis: €${item.price}\n\n` +
      `Frage / Reservierung:\n\nViele Grüße`
    );
    el.pdMail.href = `mailto:kontakt@secondhandjeans-berlin.de?subject=${subject}&body=${body}`;
    el.pdCopy.setAttribute("data-code", item.code);

    el.productDialog.showModal();
  }

  function matchesFilters(item) {
    const q = state.q.toLowerCase();

    if (q) {
      const hay = `${item.brand} ${item.model} ${item.code} W${item.sizeW} L${item.sizeL} ${item.fit} ${item.color} ${item.condition}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (state.brand !== "all" && item.brand !== state.brand) return false;
    if (state.waist !== "all" && String(item.sizeW) !== String(state.waist)) return false;
    if (state.length !== "all" && String(item.sizeL) !== String(state.length)) return false;
    if (state.fit !== "all" && item.fit !== state.fit) return false;
    if (state.color !== "all" && item.color !== state.color) return false;
    if (state.condition !== "all" && item.condition !== state.condition) return false;

    const minP = state.minPrice ? Number(state.minPrice) : null;
    const maxP = state.maxPrice ? Number(state.maxPrice) : null;

    if (minP !== null && !Number.isNaN(minP) && item.price < minP) return false;
    if (maxP !== null && !Number.isNaN(maxP) && item.price > maxP) return false;

    return true;
  }

  function sortItems(items, sort) {
    const copy = [...items];

    switch (sort) {
      case "price_asc":
        copy.sort((a, b) => a.price - b.price);
        return copy;
      case "price_desc":
        copy.sort((a, b) => b.price - a.price);
        return copy;
      case "brand_asc":
        copy.sort((a, b) => (a.brand + a.model).localeCompare(b.brand + b.model, "de"));
        return copy;
      case "newest":
      default:
        copy.sort((a, b) => b.createdAt - a.createdAt);
        return copy;
    }
  }

  function fillSelect(select, values, allLabel) {
    select.innerHTML = "";
    for (const v of values) {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = v === "all" ? allLabel : String(v);
      select.appendChild(opt);
    }
  }

  function uniqueSorted(arr) {
    return [...new Set(arr)].sort((a, b) => String(a).localeCompare(String(b), "de", { numeric: true }));
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function countBy(items, keyFn) {
    const out = {};
    for (const it of items) {
      const k = keyFn(it);
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function generateDemoInventory(n) {
    const brands = [
      "Levi’s", "Wrangler", "Lee", "Diesel", "G-Star", "Nudie Jeans",
      "Carhartt WIP", "Armani Jeans", "Tommy Hilfiger", "Calvin Klein", "Replay", "Closed"
    ];
    const models = ["501", "505", "512", "Straight", "Slim", "Tapered", "Relaxed", "Bootcut"];
    const fits = ["Straight", "Slim", "Tapered", "Relaxed"];
    const colors = ["Indigo", "Black", "Light Blue", "Grey", "Washed Blue"];
    const conditions = ["Wie neu", "Sehr gut", "Gut"];
    const waists = [26, 27, 28, 29, 30, 31, 32, 33, 34, 36, 38];
    const lengths = [28, 30, 32, 34];

    const now = Date.now();

    const items = [];
    for (let i = 0; i < n; i++) {
      const brand = pick(brands);
      const model = pick(models);
      const fit = pick(fits);
      const color = pick(colors);
      const condition = weightedPick([
        { v: "Wie neu", w: 2 },
        { v: "Sehr gut", w: 5 },
        { v: "Gut", w: 3 },
      ]);

      const sizeW = pick(waists);
      const sizeL = pick(lengths);

      const base = 35 + Math.round(Math.random() * 55);
      const premium = (brand === "Nudie Jeans" || brand === "Closed" || brand === "Diesel") ? 12 : 0;
      const condAdj = condition === "Wie neu" ? 10 : condition === "Sehr gut" ? 4 : 0;
      const price = clamp(base + premium + condAdj, 25, 120);

      const createdAt = now - Math.round(Math.random() * 1000 * 60 * 60 * 24 * 28);

      const measurements = {
        waistCm: Math.round((sizeW * 2.54) * 0.5 * 10) / 10,
        inseamCm: Math.round((sizeL * 2.54) * 10) / 10,
        riseCm: Math.round((24 + Math.random() * 10) * 10) / 10,
        legOpeningCm: Math.round((16 + Math.random() * 6) * 10) / 10,
      };

      const code = `SHJ-${String(i + 1).padStart(4, "0")}`;

      items.push({
        id: i + 1,
        code,
        brand,
        model,
        fit,
        color,
        condition,
        sizeW,
        sizeL,
        price,
        createdAt,
        measurements,
        notes:
          "Gereinigt, geprüft, Maße gemessen. Leichte Second-Hand-Spuren möglich – Details auf Anfrage.",
      });
    }

    return items;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function weightedPick(items) {
    const total = items.reduce((sum, x) => sum + x.w, 0);
    let r = Math.random() * total;
    for (const x of items) {
      r -= x.w;
      if (r <= 0) return x.v;
    }
    return items[items.length - 1].v;
  }
})();
