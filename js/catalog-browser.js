(() => {
  "use strict";
  if (window.TabanjiCatalogBrowser) return;
  const VERSION = "7";
  const debug = window.__TABANJI_CATALOG_DEBUG__ || null;
  const log = (message, error = null) => {
    if (!debug) return;
    if (error) debug.lastError = String(error?.message || error);
    console.info(`[TABANJI Catalog] ${message}`, error || "");
  };
  const state = { overlay: null, dialog: null, departments: null, content: null, opener: null, inert: new Map(), loading: null };
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `css/catalog-browser.css?v=${VERSION}`;
  stylesheet.dataset.catalogBrowserStyles = "";
  if (!document.querySelector("link[data-catalog-browser-styles]")) document.head.append(stylesheet);

  function ensureScript(src, ready) {
    if (ready()) return Promise.resolve();
    const clean = src.split("?")[0];
    const existing = [...document.scripts].find((script) => {
      try { return new URL(script.src || "", location.href).pathname.endsWith(`/${clean}`); } catch { return false; }
    });
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      document.head.append(script);
    });
  }
  async function loadDataAndCore() {
    if (window.TabanjiCatalog && window.TabanjiCatalogBrowserCore) return;
    if (!state.loading) state.loading = (async () => {
      await ensureScript("data/categories.js", () => false);
      await ensureScript("data/products.js", () => false);
      await ensureScript("js/catalog-repository.js", () => Boolean(window.TabanjiCatalog));
      await ensureScript(`js/catalog-browser-core.js?v=${VERSION}`, () => Boolean(window.TabanjiCatalogBrowserCore));
      if (!window.TabanjiCatalog || !window.TabanjiCatalogBrowserCore) throw new Error("Catalog dependencies unavailable");
    })();
    return state.loading;
  }
  function build() {
    if (state.overlay) return;
    const overlay = make("div", "catalog-browser-overlay");
    overlay.id = "catalogBrowserOverlay";
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    const dialog = make("section", "catalog-browser-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "catalogBrowserTitle");
    const header = make("header", "catalog-browser-header");
    const title = make("h2", "", "Catalog of products");
    title.id = "catalogBrowserTitle";
    const close = make("button", "catalog-browser-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close catalog");
    header.append(title, close);
    const layout = make("div", "catalog-browser-layout");
    const rail = make("nav", "catalog-browser-rail");
    rail.setAttribute("aria-label", "Product departments");
    const departments = make("div", "catalog-browser-departments");
    departments.id = "catalogBrowserDepartments";
    departments.setAttribute("role", "tablist");
    departments.setAttribute("aria-orientation", "vertical");
    rail.append(departments);
    const content = make("div", "catalog-browser-content");
    content.id = "catalogBrowserContent";
    content.tabIndex = -1;
    layout.append(rail, content);
    dialog.append(header, layout);
    overlay.append(dialog);
    document.body.append(overlay);
    Object.assign(state, { overlay, dialog, departments, content });
    close.addEventListener("click", closeCatalog);
    overlay.addEventListener("pointerdown", (event) => {
      if (event.target === overlay && matchMedia("(min-width:769px)").matches) closeCatalog();
    });
    content.addEventListener("click", (event) => { if (event.target.closest("a[href]")) release(); });
  }
  function isolate() {
    state.inert.clear();
    [...document.body.children].forEach((node) => {
      if (node !== state.overlay) { state.inert.set(node, node.inert); node.inert = true; }
    });
    document.body.classList.add("catalog-browser-open");
  }
  function release() {
    state.inert.forEach((value, node) => { if (node.isConnected) node.inert = value; });
    state.inert.clear();
    document.body.classList.remove("catalog-browser-open");
  }
  async function openCatalog(opener) {
    build();
    if (!state.overlay.hidden) return;
    state.opener = opener || document.activeElement;
    state.overlay.hidden = false;
    state.overlay.setAttribute("aria-hidden", "false");
    state.content.replaceChildren(make("p", "catalog-browser-loading", "Loading catalog…"));
    isolate();
    state.dialog.querySelector(".catalog-browser-close").focus();
    if (debug) { debug.catalogOverlayOpened = true; log("overlay opened"); }
    try {
      await loadDataAndCore();
      window.TabanjiCatalogBrowserCore.mount({ departments: state.departments, content: state.content, idPrefix: "catalogBrowser" });
    } catch (error) {
      log("overlay dependency failure", error);
      throw error;
    }
  }
  function closeCatalog() {
    if (!state.overlay || state.overlay.hidden) return;
    state.overlay.hidden = true;
    state.overlay.setAttribute("aria-hidden", "true");
    release();
    const opener = state.opener;
    state.opener = null;
    if (opener?.isConnected && !opener.inert) opener.focus();
  }
  window.addEventListener("keydown", (event) => {
    if (!state.overlay || state.overlay.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); closeCatalog(); return; }
    if (event.key !== "Tab") return;
    const nodes = [...state.dialog.querySelectorAll('a[href],button:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter((node) => !node.hidden);
    const first = nodes[0], last = nodes.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);
  window.TabanjiCatalogBrowser = { open: openCatalog, close: closeCatalog };
  if (debug) { debug.catalogModuleLoaded = true; log("module loaded"); }
})();
