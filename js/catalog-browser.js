(() => {
  "use strict";
  if (window.TabanjiCatalogBrowser) return;

  const CATALOG_PATH = "catalog.html";
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "css/catalog-browser.css";
  stylesheet.dataset.catalogBrowserStyles = "";
  if (!document.querySelector("link[data-catalog-browser-styles]")) document.head.append(stylesheet);

  const state = {
    overlay: null,
    dialog: null,
    departments: null,
    content: null,
    opener: null,
    activeId: "",
    categories: [],
    products: [],
    inert: new Map(),
    scroll: new Map(),
    loading: null
  };

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const slugify = (value) => String(value || "")
    .toLocaleLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const categoryUrl = (id) => `products.html?category=${encodeURIComponent(id)}`;
  const subcategoryUrl = (id, name) => `${categoryUrl(id)}&subcategory=${encodeURIComponent(slugify(name))}`;
  const catalogAnchor = (target) => {
    const anchor = target.closest?.("a[href]");
    if (!anchor || anchor.closest(".catalog-browser-overlay")) return null;
    try {
      const url = new URL(anchor.href, location.href);
      return url.origin === location.origin && url.pathname.split("/").pop() === CATALOG_PATH ? anchor : null;
    } catch {
      return null;
    }
  };

  function ensureScript(src, ready) {
    if (ready()) return Promise.resolve();
    const existing = [...document.scripts].find((script) => new URL(script.src || "", location.href).pathname.endsWith(`/${src}`));
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  }

  async function loadData() {
    if (window.TabanjiCatalog) return;
    if (!state.loading) {
      state.loading = (async () => {
        await ensureScript("data/categories.js", () => false);
        await ensureScript("data/products.js", () => false);
        await ensureScript("js/catalog-repository.js", () => Boolean(window.TabanjiCatalog));
        if (!window.TabanjiCatalog) throw new Error("Catalog repository unavailable");
      })();
    }
    return state.loading;
  }

  function createLink(label, href, className = "catalog-browser-link") {
    const anchor = make("a", className);
    anchor.href = href;
    anchor.append(make("span", "", label), make("span", "catalog-browser-chevron", "›"));
    anchor.lastElementChild.setAttribute("aria-hidden", "true");
    return anchor;
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
    close.id = "catalogBrowserClose";
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

    state.overlay = overlay;
    state.dialog = dialog;
    state.departments = departments;
    state.content = content;
    close.addEventListener("click", closeCatalog);
    overlay.addEventListener("pointerdown", (event) => {
      if (event.target === overlay && matchMedia("(min-width: 769px)").matches) closeCatalog();
    });
    departments.addEventListener("click", (event) => {
      const button = event.target.closest("[data-catalog-department]");
      if (button) selectDepartment(button.dataset.catalogDepartment);
    });
    departments.addEventListener("keydown", handleDepartmentKeys);
    content.addEventListener("click", (event) => {
      if (event.target.closest("a[href]")) releasePage();
    });
  }

  function availableData() {
    const products = window.TabanjiCatalog?.getProducts?.() || [];
    const categoryIds = new Set(products.map((product) => String(product.categoryId)));
    state.products = products;
    state.categories = (window.TabanjiCatalog?.getCategories?.() || [])
      .filter((category) => categoryIds.has(String(category.id)));
    if (!state.categories.some((category) => category.id === state.activeId)) {
      state.activeId = state.categories[0]?.id || "";
    }
  }

  function groupsFor(category) {
    const available = new Set(state.products
      .filter((product) => String(product.categoryId) === String(category.id))
      .map((product) => String(product.subcategorySlug || ""))
      .filter(Boolean));
    return (category.groups || []).map((group) => ({
      ...group,
      items: (group.items || []).filter((item) => available.has(slugify(item)))
    })).filter((group) => group.items.length);
  }

  function renderDepartments() {
    const fragment = document.createDocumentFragment();
    state.categories.forEach((category) => {
      const button = make("button", "catalog-browser-department", category.title);
      button.type = "button";
      button.id = `catalogBrowserDepartment-${category.id}`;
      button.dataset.catalogDepartment = category.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "catalogBrowserContent");
      const selected = category.id === state.activeId;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      fragment.append(button);
    });
    state.departments.replaceChildren(fragment);
  }

  function renderContent() {
    const category = state.categories.find((item) => item.id === state.activeId);
    if (!category) {
      const empty = make("div", "catalog-browser-empty");
      empty.append(make("h3", "", "Catalog unavailable"), make("p", "", "No product departments are available."));
      state.content.replaceChildren(empty);
      return;
    }
    const heading = make("header", "catalog-browser-content-header");
    heading.append(make("p", "", "Department"), make("h3", "", category.title));
    const destination = createLink(`All ${category.title}`, categoryUrl(category.id), "catalog-browser-destination");
    const groups = make("div", "catalog-browser-groups");
    groupsFor(category).forEach((group) => {
      const section = make("section", "catalog-browser-group");
      section.append(make("h4", "", group.title));
      const links = make("div", "catalog-browser-links");
      group.items.forEach((item) => links.append(createLink(item, subcategoryUrl(category.id, item))));
      section.append(links);
      groups.append(section);
    });
    state.content.replaceChildren(heading, destination, groups);
    state.content.setAttribute("aria-labelledby", `catalogBrowserDepartment-${category.id}`);
    state.content.scrollTop = state.scroll.get(category.id) || 0;
  }

  function selectDepartment(id, focus = false) {
    if (id === state.activeId || !state.categories.some((category) => category.id === id)) return;
    state.scroll.set(state.activeId, state.content.scrollTop);
    state.activeId = id;
    state.departments.querySelectorAll('[role="tab"]').forEach((button) => {
      const selected = button.dataset.catalogDepartment === id;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    renderContent();
  }

  function handleDepartmentKeys(event) {
    const buttons = [...state.departments.querySelectorAll('[role="tab"]')];
    const index = buttons.indexOf(event.target);
    if (index < 0 || !buttons.length) return;
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % buttons.length;
    else if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else return;
    event.preventDefault();
    selectDepartment(buttons[next].dataset.catalogDepartment, true);
  }

  function isolatePage() {
    state.inert.clear();
    [...document.body.children].forEach((node) => {
      if (node === state.overlay) return;
      state.inert.set(node, node.inert);
      node.inert = true;
    });
    document.body.classList.add("catalog-browser-open");
  }

  function releasePage() {
    state.inert.forEach((wasInert, node) => { if (node.isConnected) node.inert = wasInert; });
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
    isolatePage();
    state.dialog.querySelector(".catalog-browser-close").focus();
    try {
      await loadData();
      availableData();
      renderDepartments();
      renderContent();
    } catch {
      const failure = make("div", "catalog-browser-empty");
      failure.append(make("h3", "", "Catalog unavailable"), make("p", "", "Open the catalog page to continue."));
      failure.append(createLink("Open catalog page", CATALOG_PATH, "catalog-browser-destination"));
      state.content.replaceChildren(failure);
    }
  }

  function closeCatalog() {
    if (!state.overlay || state.overlay.hidden) return;
    state.overlay.hidden = true;
    state.overlay.setAttribute("aria-hidden", "true");
    releasePage();
    const opener = state.opener;
    state.opener = null;
    if (opener?.isConnected && !opener.inert) opener.focus();
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = catalogAnchor(event.target);
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    event.preventDefault();
    openCatalog(anchor);
  }, true);

  window.addEventListener("keydown", (event) => {
    if (!state.overlay || state.overlay.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCatalog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...state.dialog.querySelectorAll('a[href],button:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter((node) => !node.hidden);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  window.TabanjiCatalogBrowser = { open: openCatalog, close: closeCatalog };
})();
