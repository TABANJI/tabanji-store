document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const categoryList = window.TabanjiCatalog?.getCategories() || [];
  const desktopList = document.getElementById("desktopCategoryList");
  const megaPanel = document.getElementById("megaPanel");
  const mobileList = document.getElementById("mobileCategoryList");
  const searchInput = document.getElementById("catalogSearch");
  const searchResults = document.getElementById("searchResults");
  const openMenuButton = document.getElementById("openMenuButton");
  const closeMenuButton = document.getElementById("closeMenuButton");
  const drawer = document.getElementById("siteDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const themeButton = document.getElementById("themeButton");
  const drawerThemeButton = document.getElementById("drawerThemeButton");
  const desktopMedia = window.matchMedia("(min-width: 901px)");

  let activeCategoryId = categoryList[0]?.id || "";
  let selectedSearchIndex = -1;
  let currentSearchItems = [];
  let lastFocusedBeforeDrawer = null;
  const debounce = (callback, delay = 160) => { let timer; return (...args) => { clearTimeout(timer); timer = window.setTimeout(() => callback(...args), delay); }; };

  const slugify = (value) => String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const categoryUrl = (categoryId) =>
    "products.html?category=" + encodeURIComponent(categoryId);

  const subcategoryUrl = (categoryId, subcategory) =>
    categoryUrl(categoryId) + "&subcategory=" + encodeURIComponent(slugify(subcategory));

  const brandUrl = (categoryId, brand) =>
    categoryUrl(categoryId) + "&brand=" + encodeURIComponent(slugify(brand));

  const createElement = (tagName, className, text) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  };

  const createLink = (className, text, href) => {
    const link = createElement("a", className, text);
    link.href = href;
    return link;
  };

  function renderDataError() {
    const message = createElement(
      "div",
      "data-error",
      "The catalog is temporarily unavailable. Please refresh the page."
    );
    desktopList.replaceChildren();
    megaPanel.replaceChildren(message);
    mobileList.replaceChildren(message.cloneNode(true));
    searchInput.disabled = true;
    searchInput.placeholder = "Catalog data unavailable";
  }

  function renderDesktopCategories() {
    const fragment = document.createDocumentFragment();

    categoryList.forEach((category, index) => {
      const button = createElement("button", "desktop-category-button");
      button.type = "button";
      button.id = "desktop-category-" + category.id;
      button.dataset.categoryId = category.id;
      button.setAttribute("aria-controls", "megaPanel");
      button.setAttribute("aria-expanded", String(index === 0));
      button.setAttribute("role", "listitem");

      const icon = createElement("span", "category-icon", category.icon);
      icon.setAttribute("aria-hidden", "true");
      const label = createElement("span", "category-label", category.title);
      const arrow = createElement("span", "category-chevron", "›");
      arrow.setAttribute("aria-hidden", "true");
      button.append(icon, label, arrow);
      fragment.append(button);
    });

    desktopList.replaceChildren(fragment);
  }

  function renderMegaMenu(category) {
    const header = createElement("header", "mega-header");
    const titleWrap = createElement("div", "mega-title-wrap");
    const icon = createElement("span", "mega-icon", category.icon);
    icon.setAttribute("aria-hidden", "true");
    const titleText = createElement("div");
    const title = createElement("h2", "", category.title);
    const description = createElement("p", "", category.description);
    titleText.append(title, description);
    titleWrap.append(icon, titleText);

    const viewAll = createLink(
      "view-all-button",
      "View all products",
      categoryUrl(category.id)
    );
    header.append(titleWrap, viewAll);

    const content = createElement("div", "mega-content");
    const groupsGrid = createElement("div", "subcategory-grid");

    category.groups.forEach((group) => {
      const groupElement = createElement("section", "subcategory-group");
      const groupTitle = createElement("h3", "", group.title);
      const list = createElement("ul");

      group.items.forEach((item) => {
        const listItem = createElement("li");
        listItem.append(createLink("", item, subcategoryUrl(category.id, item)));
        list.append(listItem);
      });

      groupElement.append(groupTitle, list);
      groupsGrid.append(groupElement);
    });

    const aside = createElement("aside", "mega-aside", "");
    aside.setAttribute("aria-label", category.title + " highlights");

    const brandsCard = createElement("section", "info-card");
    const brandsTitle = createElement("h3", "", "Popular brands");
    const brandList = createElement("ul", "brand-list");
    category.brands.forEach((brand) => {
      const item = createElement("li");
      item.append(createLink("", brand, brandUrl(category.id, brand)));
      brandList.append(item);
    });
    brandsCard.append(brandsTitle, brandList);

    const featuredCard = createElement("section", "info-card");
    const featuredTitle = createElement("h3", "", "Recommended");
    const featuredList = createElement("ul", "featured-list");
    category.featured.forEach((featured) => {
      const item = createElement("li");
      item.append(createLink("", featured, subcategoryUrl(category.id, featured)));
      featuredList.append(item);
    });
    featuredCard.append(featuredTitle, featuredList);

    const banner = createElement("a", "promo-banner");
    banner.href = categoryUrl(category.id);
    banner.style.setProperty("--banner-accent", category.banner.accent);
    banner.setAttribute("aria-label", category.banner.title + ". View all " + category.title);
    banner.append(
      createElement("small", "", category.banner.eyebrow),
      createElement("strong", "", category.banner.title),
      createElement("span", "", category.banner.text)
    );

    aside.append(brandsCard, featuredCard, banner);
    content.append(groupsGrid, aside);
    megaPanel.replaceChildren(header, content);
  }

  function activateDesktopCategory(categoryId) {
    if (!desktopMedia.matches) return;
    const category = categoryList.find((item) => item.id === categoryId);
    if (!category || activeCategoryId === categoryId && megaPanel.childElementCount) return;

    activeCategoryId = categoryId;
    desktopList.querySelectorAll(".desktop-category-button").forEach((button) => {
      const isActive = button.dataset.categoryId === categoryId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-expanded", String(isActive));
    });

    megaPanel.classList.add("is-switching");
    window.requestAnimationFrame(() => {
      renderMegaMenu(category);
      window.requestAnimationFrame(() => megaPanel.classList.remove("is-switching"));
    });
  }

  function initializeDesktopCatalog() {
    renderDesktopCategories();
    const firstButton = desktopList.querySelector(".desktop-category-button");
    if (firstButton) firstButton.classList.add("is-active");
    if (categoryList[0]) renderMegaMenu(categoryList[0]);

    desktopList.addEventListener("pointerover", (event) => {
      if (!desktopMedia.matches || event.pointerType === "touch") return;
      const button = event.target.closest(".desktop-category-button");
      if (button) activateDesktopCategory(button.dataset.categoryId);
    });

    desktopList.addEventListener("focusin", (event) => {
      const button = event.target.closest(".desktop-category-button");
      if (button) activateDesktopCategory(button.dataset.categoryId);
    });

    desktopList.addEventListener("click", (event) => {
      const button = event.target.closest(".desktop-category-button");
      if (button) activateDesktopCategory(button.dataset.categoryId);
    });

    desktopList.addEventListener("keydown", (event) => {
      const buttons = [...desktopList.querySelectorAll(".desktop-category-button")];
      const currentIndex = buttons.indexOf(event.target);
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % buttons.length;
      if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = buttons.length - 1;

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        buttons[nextIndex].focus();
      }
    });
  }

  function createAccordionItem(category) {
    const item = createElement("article", "accordion-item");
    const button = createElement("button", "accordion-trigger");
    const panel = createElement("div", "accordion-panel");
    const buttonId = "accordion-button-" + category.id;
    const panelId = "accordion-panel-" + category.id;

    button.type = "button";
    button.id = buttonId;
    button.dataset.categoryId = category.id;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panelId);
    panel.id = panelId;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", buttonId);
    panel.setAttribute("aria-hidden", "true");

    const icon = createElement("span", "category-icon", category.icon);
    icon.setAttribute("aria-hidden", "true");
    button.append(
      icon,
      createElement("strong", "", category.title),
      createElement("span", "accordion-arrow", "›")
    );

    const inner = createElement("div", "accordion-inner");
    category.groups.forEach((group) => {
      const groupElement = createElement("section", "accordion-group");
      const links = createElement("div", "accordion-group-links");
      group.items.forEach((subcategory) => {
        links.append(createLink("", subcategory, subcategoryUrl(category.id, subcategory)));
      });
      groupElement.append(createElement("h3", "", group.title), links);
      inner.append(groupElement);
    });
    inner.append(createLink("accordion-view-all", "View all products", categoryUrl(category.id)));
    panel.append(inner);
    item.append(button, panel);
    return item;
  }

  function renderMobileAccordion() {
    const fragment = document.createDocumentFragment();
    categoryList.forEach((category) => fragment.append(createAccordionItem(category)));
    mobileList.replaceChildren(fragment);

    mobileList.addEventListener("click", (event) => {
      const button = event.target.closest(".accordion-trigger");
      if (!button) return;
      toggleAccordion(button);
    });
  }

  function toggleAccordion(button) {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    const shouldOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(shouldOpen));
    panel.setAttribute("aria-hidden", String(!shouldOpen));
    panel.classList.toggle("is-open", shouldOpen);
    panel.style.maxHeight = shouldOpen ? panel.scrollHeight + "px" : "0px";
  }

  function flattenSearchData() {
    const items = [];
    categoryList.forEach((category) => {
      items.push({
        type: "Category",
        label: category.title,
        context: "All " + category.title,
        icon: category.icon,
        href: categoryUrl(category.id),
        keywords: category.title + " " + category.description
      });

      category.groups.forEach((group) => {
        items.push({
          type: "Group",
          label: group.title,
          context: category.title,
          icon: category.icon,
          href: categoryUrl(category.id),
          keywords: group.title + " " + category.title
        });

        group.items.forEach((subcategory) => {
          items.push({
            type: "Subcategory",
            label: subcategory,
            context: category.title + " · " + group.title,
            icon: category.icon,
            href: subcategoryUrl(category.id, subcategory),
            keywords: subcategory + " " + group.title + " " + category.title
          });
        });
      });
    });
    return items;
  }

  const searchableItems = flattenSearchData();

  function closeSearchResults() {
    searchResults.hidden = true;
    searchResults.replaceChildren();
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    currentSearchItems = [];
    selectedSearchIndex = -1;
  }

  function renderSearchResults(query) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      closeSearchResults();
      return;
    }

    currentSearchItems = searchableItems
      .filter((item) => item.keywords.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 10);
    selectedSearchIndex = -1;
    const fragment = document.createDocumentFragment();

    if (!currentSearchItems.length) {
      fragment.append(createElement("p", "search-empty", "No results found"));
    } else {
      currentSearchItems.forEach((item, index) => {
        const result = createLink("search-result", "", item.href);
        result.id = "search-result-" + index;
        result.dataset.searchIndex = String(index);
        result.setAttribute("role", "option");
        result.setAttribute("aria-selected", "false");

        const icon = createElement("span", "search-result-icon", item.icon);
        icon.setAttribute("aria-hidden", "true");
        const text = createElement("span");
        text.append(createElement("strong", "", item.label), createElement("small", "", item.context));
        result.append(icon, text, createElement("small", "", item.type));
        fragment.append(result);
      });
    }

    searchResults.replaceChildren(fragment);
    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function updateSelectedSearchResult(nextIndex) {
    const results = [...searchResults.querySelectorAll(".search-result")];
    if (!results.length) return;
    selectedSearchIndex = (nextIndex + results.length) % results.length;
    results.forEach((result, index) => {
      const isSelected = index === selectedSearchIndex;
      result.classList.toggle("is-selected", isSelected);
      result.setAttribute("aria-selected", String(isSelected));
      if (isSelected) result.scrollIntoView({ block: "nearest" });
    });
    searchInput.setAttribute("aria-activedescendant", results[selectedSearchIndex].id);
  }

  function initializeSearch() {
    searchInput.addEventListener("input", debounce(() => renderSearchResults(searchInput.value)));
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) renderSearchResults(searchInput.value);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        updateSelectedSearchResult(selectedSearchIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        updateSelectedSearchResult(selectedSearchIndex - 1);
      } else if (event.key === "Enter" && selectedSearchIndex >= 0) {
        event.preventDefault();
        window.location.href = currentSearchItems[selectedSearchIndex].href;
      } else if (event.key === "Escape") {
        event.preventDefault();
        searchInput.value = "";
        closeSearchResults();
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".search-shell")) closeSearchResults();
    });
  }

  function renderPopularCategories() {
    const container = document.getElementById("popularCategories");
    const fragment = document.createDocumentFragment();
    categoryList.filter((category) => category.popular).slice(0, 8).forEach((category) => {
      const card = createLink("category-card", "", categoryUrl(category.id));
      const icon = createElement("span", "category-card-icon", category.icon);
      icon.setAttribute("aria-hidden", "true");
      card.append(
        icon,
        createElement("strong", "", category.title),
        createElement("small", "", category.groups.length + " product groups →")
      );
      fragment.append(card);
    });
    container.replaceChildren(fragment);
  }

  function renderPopularBrands() {
    const container = document.getElementById("popularBrands");
    const seen = new Set();
    const brandItems = [];
    categoryList.forEach((category) => {
      category.brands.forEach((brand) => {
        const normalizedBrand = brand.toLocaleLowerCase();
        if (!seen.has(normalizedBrand)) {
          seen.add(normalizedBrand);
          brandItems.push({ brand, categoryId: category.id });
        }
      });
    });

    const fragment = document.createDocumentFragment();
    brandItems.slice(0, 16).forEach(({ brand, categoryId }) => {
      fragment.append(createLink("brand-tile", brand, brandUrl(categoryId, brand)));
    });
    container.replaceChildren(fragment);
  }

  function renderSpecialOffers() {
    const container = document.getElementById("specialOffers");
    const offerCategories = categoryList.filter((category) => category.offer).slice(0, 3);
    const fragment = document.createDocumentFragment();

    offerCategories.forEach((category) => {
      const card = createElement("article", "offer-card");
      card.style.setProperty("--offer-accent", category.banner.accent);
      card.append(
        createElement("span", "", "Special offer"),
        createElement("h3", "", category.offer),
        createElement("p", "", category.description),
        createLink("", "Shop " + category.title, categoryUrl(category.id))
      );
      fragment.append(card);
    });
    container.replaceChildren(fragment);
  }

  function openDrawer() {
    lastFocusedBeforeDrawer = document.activeElement;
    drawerOverlay.hidden = false;
    window.requestAnimationFrame(() => drawerOverlay.classList.add("is-visible"));
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    openMenuButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    closeMenuButton.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerOverlay.classList.remove("is-visible");
    openMenuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) drawerOverlay.hidden = true;
    }, 220);
    if (lastFocusedBeforeDrawer instanceof HTMLElement) lastFocusedBeforeDrawer.focus();
  }

  function initializeDrawer() {
    openMenuButton.addEventListener("click", openDrawer);
    closeMenuButton.addEventListener("click", closeDrawer);
    drawerOverlay.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDrawer));
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Theme still works when storage is unavailable.
    }
  }

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeButton.textContent = isDark ? "☀" : "☾";
    drawerThemeButton.textContent = isDark ? "☀️ Light theme" : "🌙 Dark theme";
  }

  function toggleTheme() {
    const nextDarkState = !document.body.classList.contains("dark-mode");
    applyTheme(nextDarkState);
    saveTheme(nextDarkState ? "dark" : "light");
  }

  function initializeTheme() {
    const savedTheme = getSavedTheme();
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);
    themeButton.addEventListener("click", toggleTheme);
    drawerThemeButton.addEventListener("click", toggleTheme);
  }

  function handleGlobalEscape(event) {
    if (event.key !== "Escape") return;
    if (drawer.classList.contains("is-open")) closeDrawer();
    if (!searchResults.hidden) {
      searchInput.value = "";
      closeSearchResults();
      searchInput.focus();
    }
  }

  function handleResize() {
    if (desktopMedia.matches) {
      mobileList.querySelectorAll(".accordion-trigger[aria-expanded='true']").forEach((button) => {
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
      });
    } else {
      mobileList.querySelectorAll(".accordion-panel.is-open").forEach((panel) => {
        panel.style.maxHeight = panel.scrollHeight + "px";
      });
    }
  }

  initializeTheme();
  initializeDrawer();
  initializeSearch();
  document.addEventListener("keydown", handleGlobalEscape);

  if (!categoryList.length) {
    renderDataError();
    return;
  }

  initializeDesktopCatalog();
  renderMobileAccordion();
  renderPopularCategories();
  renderPopularBrands();
  renderSpecialOffers();
  window.addEventListener("resize", handleResize);
});
