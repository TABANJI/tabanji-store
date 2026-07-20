document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const repository = window.TabanjiCatalog;
  const store = window.TabanjiStore;
  const departmentList = document.getElementById("departmentList");
  const pane = document.getElementById("subcategoryPane");
  const content = document.getElementById("subcategoryContent");
  const empty = document.getElementById("catalogEmpty");
  const search = document.getElementById("catalogSearch");
  const clearSearch = document.getElementById("clearCatalogSearch");
  const close = document.getElementById("closeCatalog");
  const scrollPositions = new Map();
  let query = "";

  const products = repository?.getProducts?.() || [];
  const productCategoryIds = new Set(products.map((product) => String(product.categoryId)));
  const productSubcategories = new Map();
  products.forEach((product) => {
    const categoryId = String(product.categoryId);
    if (!productSubcategories.has(categoryId)) productSubcategories.set(categoryId, new Set());
    if (product.subcategorySlug) productSubcategories.get(categoryId).add(String(product.subcategorySlug));
  });
  const allCategories = (repository?.getCategories?.() || []).filter((category) => productCategoryIds.has(String(category.id)));
  const requestedCategory = new URLSearchParams(location.search).get("category");
  let activeId = allCategories.some((category) => category.id === requestedCategory)
    ? requestedCategory
    : allCategories[0]?.id || "";

  const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
  const slugify = (value) => String(value || "")
    .toLocaleLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const categoryUrl = (categoryId) => `products.html?category=${encodeURIComponent(categoryId)}`;
  const subcategoryUrl = (categoryId, subcategory) =>
    `${categoryUrl(categoryId)}&subcategory=${encodeURIComponent(slugify(subcategory))}`;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const link = (text, href, className = "subcategory-link") => {
    const anchor = make("a", className);
    anchor.href = href;
    const label = make("span", "", text);
    const arrow = make("span", "link-chevron", "›");
    arrow.setAttribute("aria-hidden", "true");
    anchor.append(label, arrow);
    return anchor;
  };
  const availableGroups = (category) => (category.groups || []).map((group) => ({
    ...group,
    items: (group.items || []).filter((item) => productSubcategories.get(String(category.id))?.has(slugify(item)))
  })).filter((group) => group.items.length);
  const searchableText = (category) => normalize([
    category.title,
    ...availableGroups(category).flatMap((group) => [group.title, ...group.items])
  ].join(" "));
  const visibleCategories = () => allCategories.filter((category) => !query || searchableText(category).includes(query));
  const matchingGroups = (category) => availableGroups(category).map((group) => {
    if (!query || normalize(category.title).includes(query) || normalize(group.title).includes(query)) return group;
    return { ...group, items: (group.items || []).filter((item) => normalize(item).includes(query)) };
  }).filter((group) => (group.items || []).length);

  function renderDepartments() {
    const visible = visibleCategories();
    if (!visible.some((category) => category.id === activeId)) activeId = visible[0]?.id || "";
    const fragment = document.createDocumentFragment();
    visible.forEach((category) => {
      const button = make("button", "department-button", category.title);
      button.type = "button";
      button.id = `department-${category.id}`;
      button.dataset.categoryId = category.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "subcategoryContent");
      const selected = category.id === activeId;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      fragment.append(button);
    });
    departmentList.replaceChildren(fragment);
    empty.hidden = visible.length > 0;
    pane.classList.toggle("is-empty", visible.length === 0);
  }

  function renderSubcategories({ preserveScroll = false } = {}) {
    const category = allCategories.find((item) => item.id === activeId);
    if (!category) {
      content.replaceChildren();
      return;
    }
    const heading = make("header", "subcategory-header");
    const eyebrow = make("p", "subcategory-eyebrow", "Department");
    const title = make("h2", "", category.title);
    heading.append(eyebrow, title);
    const destination = link(`All ${category.title}`, categoryUrl(category.id), "primary-destination");

    const groups = matchingGroups(category);
    const groupContainer = make("div", "subcategory-groups");
    groups.forEach((group) => {
      const section = make("section", "subcategory-group");
      const groupTitle = make("h3", "", group.title);
      const links = make("div", "subcategory-links");
      (group.items || []).forEach((item) => links.append(link(item, subcategoryUrl(category.id, item))));
      section.append(groupTitle, links);
      groupContainer.append(section);
    });

    const popularItems = groups.flatMap((group) => group.items || []).slice(0, 5);
    const popular = make("section", "popular-group");
    if (popularItems.length) {
      popular.append(make("h3", "", "Popular categories"));
      const popularLinks = make("div", "popular-links");
      popularItems.forEach((item) => popularLinks.append(link(item, subcategoryUrl(category.id, item), "popular-link")));
      popular.append(popularLinks);
    }

    content.replaceChildren(heading, destination, popular, groupContainer);
    content.setAttribute("aria-labelledby", `department-${category.id}`);
    if (!preserveScroll) pane.scrollTop = scrollPositions.get(category.id) || 0;
  }

  function selectCategory(categoryId, focus = false) {
    if (!allCategories.some((category) => category.id === categoryId) || categoryId === activeId) return;
    scrollPositions.set(activeId, pane.scrollTop);
    activeId = categoryId;
    departmentList.querySelectorAll("[role=tab]").forEach((button) => {
      const selected = button.dataset.categoryId === activeId;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    renderSubcategories();
  }

  function updateSearch() {
    query = normalize(search.value);
    clearSearch.hidden = !query;
    renderDepartments();
    renderSubcategories();
  }

  let searchTimer;
  search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(updateSearch, 140);
  });
  clearSearch.addEventListener("click", () => {
    search.value = "";
    updateSearch();
    search.focus();
  });
  departmentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-id]");
    if (button) selectCategory(button.dataset.categoryId);
  });
  departmentList.addEventListener("keydown", (event) => {
    const tabs = [...departmentList.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(event.target);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    selectCategory(tabs[nextIndex].dataset.categoryId, true);
  });
  close.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "index.html";
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !matchMedia("(max-width: 768px)").matches) {
      event.preventDefault();
      close.click();
    }
  });

  const savedTheme = (() => {
    try { return localStorage.getItem("theme"); } catch { return null; }
  })();
  document.body.classList.toggle("dark-mode", savedTheme === "dark" || (!savedTheme && matchMedia("(prefers-color-scheme: dark)").matches));
  renderDepartments();
  renderSubcategories();
  store?.updateHeaderCounters?.();
});
