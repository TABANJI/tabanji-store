(() => {
  "use strict";
  if (window.TabanjiSearchBrowser) return;

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "css/search-browser.css";
  style.dataset.searchBrowserStyles = "";
  if (!document.querySelector("link[data-search-browser-styles]")) document.head.append(style);

  const state = { overlay: null, dialog: null, input: null, results: null, opener: null, selected: -1, timer: 0, placeholderTimer: 0, inert: new Map(), loading: null, suppressFocus: false };
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const money = (value, currency = "USD") => {
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
    catch { return `${value} ${currency}`; }
  };
  const discount = (product) => product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const route = (type, value) => type === "category"
    ? `products.html?category=${encodeURIComponent(value)}`
    : type === "brand"
      ? `products.html?brand=${encodeURIComponent(value)}`
      : `search.html?q=${encodeURIComponent(value)}`;
  const headerSearch = (target) => {
    const input = target.closest?.('input[type="search"]');
    return input && input.closest("header") ? input : null;
  };

  function ensureScript(src, ready) {
    if (ready()) return Promise.resolve();
    const existing = [...document.scripts].find((script) => (script.src || "").endsWith(src));
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  }
  async function loadEngine() {
    if (window.TabanjiSearchEngine && window.TabanjiCatalog) return;
    if (!state.loading) state.loading = (async () => {
      await ensureScript("data/categories.js", () => false);
      await ensureScript("data/products.js", () => false);
      await ensureScript("js/catalog-repository.js", () => Boolean(window.TabanjiCatalog));
      await ensureScript("js/search-engine.js", () => Boolean(window.TabanjiSearchEngine));
      if (!window.TabanjiCatalog || !window.TabanjiSearchEngine) throw new Error("Search unavailable");
    })();
    return state.loading;
  }

  function icon(path) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const part = document.createElementNS("http://www.w3.org/2000/svg", "path");
    part.setAttribute("d", path);
    svg.append(part);
    return svg;
  }

  function build() {
    if (state.overlay) return;
    const overlay = make("div", "search-browser-overlay");
    overlay.id = "searchBrowserOverlay";
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    const dialog = make("section", "search-browser-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "searchBrowserTitle");
    const title = make("h2", "search-browser-title", "Search TABANJI");
    title.id = "searchBrowserTitle";
    const bar = make("form", "search-browser-bar");
    bar.setAttribute("role", "search");
    bar.append(icon("M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 4 4"));
    const input = make("input", "search-browser-input");
    input.id = "searchBrowserInput";
    input.type = "search";
    input.autocomplete = "off";
    input.placeholder = "Search products, brands or categories";
    input.setAttribute("aria-label", "Search products, brands or categories");
    input.setAttribute("aria-controls", "searchBrowserResults");
    input.setAttribute("aria-autocomplete", "list");
    const clear = make("button", "search-browser-clear", "×");
    clear.type = "button";
    clear.setAttribute("aria-label", "Clear search");
    clear.hidden = true;
    const voice = make("button", "search-browser-voice");
    voice.type = "button";
    voice.setAttribute("aria-label", "Voice search placeholder");
    voice.title = "Voice search is not available in this demo";
    voice.append(icon("M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3m-6 9a6 6 0 0 0 12 0M12 18v3M9 21h6"));
    const close = make("button", "search-browser-close", "Close");
    close.type = "button";
    close.setAttribute("aria-label", "Close search");
    bar.append(input, clear, voice, close);
    const loader = make("span", "search-browser-loader");
    loader.setAttribute("aria-hidden", "true");
    bar.append(loader);
    const results = make("div", "search-browser-results");
    results.id = "searchBrowserResults";
    results.setAttribute("role", "listbox");
    results.setAttribute("aria-label", "Search suggestions");
    dialog.append(title, bar, results);
    overlay.append(dialog);
    document.body.append(overlay);
    Object.assign(state, { overlay, dialog, input, results });

    close.addEventListener("click", closeSearch);
    clear.addEventListener("click", () => { input.value = ""; clear.hidden = true; render(); input.focus(); });
    bar.addEventListener("submit", (event) => { event.preventDefault(); submit(input.value); });
    input.addEventListener("input", () => {
      clear.hidden = !input.value;
      dialog.classList.add("is-loading");
      clearTimeout(state.timer);
      state.timer = window.setTimeout(() => { render(); dialog.classList.remove("is-loading"); }, 140);
    });
    results.addEventListener("click", handleResultClick);
    results.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const item = event.target.closest("[data-search-nav]");
      if (!item || event.target.closest("[data-favorite-id]")) return;
      event.preventDefault();
      activate(item);
    });
    overlay.addEventListener("pointerdown", (event) => { if (event.target === overlay && matchMedia("(min-width:769px)").matches) closeSearch(); });
  }

  function section(titleText, nodes, action = null) {
    if (!nodes.length) return null;
    const sectionNode = make("section", "search-browser-section");
    const header = make("header", "search-browser-section-header");
    header.append(make("h3", "", titleText));
    if (action) header.append(action);
    const list = make("div", "search-browser-list");
    list.append(...nodes);
    sectionNode.append(header, list);
    return sectionNode;
  }
  function navItem(label, value, type = "query", meta = "") {
    const button = make("button", "search-browser-chip");
    button.type = "button";
    button.dataset.searchValue = value;
    button.dataset.searchType = type;
    button.dataset.searchNav = "";
    button.setAttribute("role", "option");
    if (type === "category") {
      const categoryIcon = make("span", "search-category-icon");
      categoryIcon.append(icon("M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"));
      button.append(categoryIcon);
    }
    button.append(make("span", "search-browser-chip-label", label));
    if (meta) button.append(make("small", "", meta));
    return button;
  }
  function productRow(product) {
    const row = make("article", "search-product-row");
    row.dataset.searchNav = "";
    row.dataset.href = `product.html?id=${encodeURIComponent(product.id)}`;
    row.tabIndex = 0;
    row.setAttribute("role", "option");
    const image = make("img");
    image.src = product.image;
    image.alt = "";
    image.loading = "lazy";
    const info = make("div", "search-product-info");
    info.append(make("small", "search-product-brand", product.brand), make("strong", "", product.title));
    const meta = make("div", "search-product-meta");
    meta.append(make("span", "search-product-rating", `★ ${product.rating}`), make("span", product.inStock ? "is-stock" : "is-unavailable", product.inStock ? "In stock" : "Out of stock"));
    info.append(meta);
    const price = make("div", "search-product-price", money(product.price, product.currency));
    if (product.oldPrice) price.append(make("small", "", `-${discount(product)}%`));
    const favorite = make("button", "search-product-favorite", window.TabanjiStore?.isFavorite?.(product.id) ? "♥" : "♡");
    favorite.type = "button";
    favorite.dataset.favoriteId = product.id;
    favorite.setAttribute("aria-label", `Toggle favorite for ${product.title}`);
    row.append(image, info, price, favorite);
    return row;
  }

  function renderInitial(engine) {
    const recent = engine.readRecent();
    const recentItems = recent.length
      ? recent.map((value) => navItem(value, value))
      : [make("p", "search-browser-muted", "Your recent searches will appear here.")];
    const clearHistory = make("button", "search-browser-text-button", "Clear history");
    clearHistory.type = "button";
    clearHistory.addEventListener("click", () => { engine.clearRecent(); renderInitial(engine); });
    const blocks = [
      section("Recent searches", recentItems, recent.length ? clearHistory : null),
      section("Popular searches", engine.popular.slice(0, 7).map((value) => navItem(value, value))),
      section("Suggested categories", engine.searchCategories("", 6).map(({ category, count }) => navItem(category.title, category.id, "category", `${count} products`))),
      section("Popular brands", engine.searchBrands("", 6).map(({ brand, count }) => navItem(brand, brand, "brand", `${count} products`))),
      section("Trending products", engine.trending(6).map(productRow))
    ].filter(Boolean);
    state.results.replaceChildren(...blocks);
    resetNavigation();
  }

  function renderEmpty(engine, query) {
    const empty = make("div", "search-browser-empty");
    empty.append(icon("M4 4l16 16M11 4a7 7 0 0 0-5 12"), make("h3", "", "No results found"), make("p", "", `Try a broader search for “${query}”.`));
    const categories = section("Popular categories", engine.searchCategories("", 5).map(({ category, count }) => navItem(category.title, category.id, "category", `${count} products`)));
    state.results.replaceChildren(empty, categories);
    resetNavigation();
  }

  function render() {
    const engine = window.TabanjiSearchEngine;
    if (!engine) return;
    const query = state.input.value.trim();
    if (!query) { renderInitial(engine); return; }
    const products = engine.searchProducts(query, 8);
    const categories = engine.searchCategories(query, 5);
    const brands = engine.searchBrands(query, 5);
    const blocks = [
      section("Products", products.map(productRow)),
      section("Categories", categories.map(({ category, count }) => navItem(category.title, category.id, "category", `${count} products`))),
      section("Brands", brands.map(({ brand, count }) => navItem(brand, brand, "brand", `${count} products`)))
    ].filter(Boolean);
    if (!blocks.length) renderEmpty(engine, query);
    else { state.results.replaceChildren(...blocks); resetNavigation(); }
  }

  function resetNavigation() {
    state.selected = -1;
    state.input.removeAttribute("aria-activedescendant");
    [...state.results.querySelectorAll("[data-search-nav]")].forEach((node, index) => {
      node.id = `searchBrowserOption-${index}`;
      node.classList.remove("is-selected");
    });
  }
  function move(delta) {
    const options = [...state.results.querySelectorAll("[data-search-nav]")];
    if (!options.length) return;
    state.selected = (state.selected + delta + options.length) % options.length;
    options.forEach((node, index) => node.classList.toggle("is-selected", index === state.selected));
    const active = options[state.selected];
    state.input.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  }
  function activate(node) {
    if (node.dataset.href) { location.href = node.dataset.href; return; }
    const value = node.dataset.searchValue;
    const type = node.dataset.searchType;
    if (type === "category" || type === "brand") location.href = route(type, value);
    else submit(value);
  }
  function submit(value) {
    const query = String(value || "").trim();
    if (!query) return;
    window.TabanjiSearchEngine?.addRecent(query);
    location.href = route("query", query);
  }
  function handleResultClick(event) {
    const favorite = event.target.closest("[data-favorite-id]");
    if (favorite) {
      event.preventDefault();
      event.stopPropagation();
      window.TabanjiStore?.toggleFavorite?.(favorite.dataset.favoriteId);
      favorite.textContent = window.TabanjiStore?.isFavorite?.(favorite.dataset.favoriteId) ? "♥" : "♡";
      window.TabanjiStore?.updateHeaderCounters?.();
      return;
    }
    const item = event.target.closest("[data-search-nav]");
    if (item) activate(item);
  }

  function isolate() {
    state.inert.clear();
    [...document.body.children].forEach((node) => { if (node !== state.overlay) { state.inert.set(node, node.inert); node.inert = true; } });
    document.body.classList.add("search-browser-open");
  }
  function release() {
    state.inert.forEach((value, node) => { if (node.isConnected) node.inert = value; });
    state.inert.clear();
    document.body.classList.remove("search-browser-open");
  }
  function animatePlaceholder() {
    clearInterval(state.placeholderTimer);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const values = ["Search products", "Search brands", "Search categories"];
    let index = 0;
    state.placeholderTimer = window.setInterval(() => {
      if (!state.input.value) { index = (index + 1) % values.length; state.input.placeholder = values[index]; }
    }, 2400);
  }

  async function openSearch(opener) {
    build();
    if (!state.overlay.hidden) return;
    state.opener = opener;
    state.input.value = opener?.value || "";
    state.overlay.hidden = false;
    state.overlay.setAttribute("aria-hidden", "false");
    isolate();
    state.input.focus();
    animatePlaceholder();
    try { await loadEngine(); render(); }
    catch { state.results.replaceChildren(make("p", "search-browser-loading", "Search is temporarily unavailable.")); }
  }
  function closeSearch() {
    if (!state.overlay || state.overlay.hidden) return;
    clearTimeout(state.timer);
    clearInterval(state.placeholderTimer);
    state.overlay.hidden = true;
    state.overlay.setAttribute("aria-hidden", "true");
    release();
    const opener = state.opener;
    state.opener = null;
    state.suppressFocus = true;
    if (opener?.isConnected && !opener.inert) opener.focus();
    queueMicrotask(() => { state.suppressFocus = false; });
  }

  document.addEventListener("focusin", (event) => {
    if (state.suppressFocus || state.overlay?.contains(event.target)) return;
    const input = headerSearch(event.target);
    if (input) openSearch(input);
  }, true);
  window.addEventListener("keydown", (event) => {
    if (!state.overlay || state.overlay.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); closeSearch(); return; }
    if (event.key === "ArrowDown" && document.activeElement === state.input) { event.preventDefault(); move(1); return; }
    if (event.key === "ArrowUp" && document.activeElement === state.input) { event.preventDefault(); move(-1); return; }
    if (event.key === "Enter" && document.activeElement === state.input && state.selected >= 0) {
      event.preventDefault();
      activate(state.results.querySelectorAll("[data-search-nav]")[state.selected]);
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = [...state.dialog.querySelectorAll('button:not(:disabled),input,[href],[tabindex]:not([tabindex="-1"])')].filter((node) => !node.hidden);
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);

  window.TabanjiSearchBrowser = { open: openSearch, close: closeSearch };
})();
