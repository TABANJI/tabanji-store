(() => {
  "use strict";
  if (window.TabanjiCatalogBrowserCore) return;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const slugify = (value) => String(value || "").toLocaleLowerCase().trim()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const categoryUrl = (id) => `products.html?category=${encodeURIComponent(id)}`;
  const subcategoryUrl = (id, name) => `${categoryUrl(id)}&subcategory=${encodeURIComponent(slugify(name))}`;
  const link = (label, href, className = "catalog-browser-link") => {
    const anchor = make("a", className);
    anchor.href = href;
    anchor.append(make("span", "", label), make("span", "catalog-browser-chevron", "›"));
    anchor.lastElementChild.setAttribute("aria-hidden", "true");
    return anchor;
  };

  function mount({ departments, content, idPrefix = "catalogBrowser", query = "", activeId = "" }) {
    const repository = window.TabanjiCatalog;
    const products = repository?.getProducts?.() || [];
    const categories = repository?.getCategories?.() || [];
    const scroll = new Map();
    let currentQuery = String(query).trim().toLocaleLowerCase();
    let currentId = categories.find((category) => category.id === activeId || category.slug === activeId)?.id || categories[0]?.id || "";

    const groupsFor = (category) => {
      const available = new Set(products.filter((product) => String(product.categoryId) === String(category.id))
        .map((product) => String(product.subcategorySlug || "")).filter(Boolean));
      return (category.groups || []).map((group) => ({ ...group, items: (group.items || []).filter((item) => available.has(slugify(item))) }))
        .filter((group) => group.items.length)
        .map((group) => currentQuery && !group.title.toLocaleLowerCase().includes(currentQuery) && !category.title.toLocaleLowerCase().includes(currentQuery)
          ? { ...group, items: group.items.filter((item) => item.toLocaleLowerCase().includes(currentQuery)) }
          : group)
        .filter((group) => group.items.length);
    };
    const visibleCategories = () => categories.filter((category) => !currentQuery || [category.title, ...groupsFor({ ...category })
      .flatMap((group) => [group.title, ...group.items])].join(" ").toLocaleLowerCase().includes(currentQuery));

    function renderContent() {
      const category = categories.find((item) => item.id === currentId);
      if (!category) {
        const empty = make("div", "catalog-browser-empty");
        empty.append(make("h3", "", "No categories found"), make("p", "", "Try a different category name."));
        content.replaceChildren(empty);
        return;
      }
      const heading = make("header", "catalog-browser-content-header");
      heading.append(make("p", "", "Department"), make("h3", "", category.title));
      const categoryProducts = products.filter((product) => String(product.categoryId) === String(category.id));
      if (category.destination) {
        const destination = link(category.destinationLabel || `View ${category.title}`, category.destination, "catalog-browser-destination");
        content.replaceChildren(heading, destination);
        content.setAttribute("aria-labelledby", `${idPrefix}Department-${category.id}`);
        content.scrollTop = scroll.get(category.id) || 0;
        return;
      }
      if (!categoryProducts.length) {
        const empty = make("div", "catalog-browser-empty");
        empty.append(
          make("h3", "", "Products are coming soon"),
          make("p", "", "We’re preparing products and offers for this department."),
          link("View all products", "products.html", "catalog-browser-destination")
        );
        content.replaceChildren(heading, empty);
        content.setAttribute("aria-labelledby", `${idPrefix}Department-${category.id}`);
        content.scrollTop = scroll.get(category.id) || 0;
        return;
      }
      const groups = make("div", "catalog-browser-groups");
      groupsFor(category).forEach((group) => {
        const section = make("section", "catalog-browser-group");
        section.append(make("h4", "", group.title));
        const links = make("div", "catalog-browser-links");
        group.items.forEach((item) => links.append(link(item, subcategoryUrl(category.id, item))));
        section.append(links);
        groups.append(section);
      });
      content.replaceChildren(heading, link(`All ${category.title}`, categoryUrl(category.id), "catalog-browser-destination"), groups);
      content.setAttribute("aria-labelledby", `${idPrefix}Department-${category.id}`);
      content.scrollTop = scroll.get(category.id) || 0;
    }

    function renderDepartments() {
      const visible = visibleCategories();
      if (!visible.some((category) => category.id === currentId)) currentId = visible[0]?.id || "";
      departments.replaceChildren(...visible.map((category) => {
        const button = make("button", "catalog-browser-department", category.title);
        button.type = "button";
        button.id = `${idPrefix}Department-${category.id}`;
        button.dataset.catalogDepartment = category.id;
        button.setAttribute("role", "tab");
        button.setAttribute("aria-controls", content.id);
        const selected = category.id === currentId;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        return button;
      }));
      renderContent();
    }

    function select(id, focus = false) {
      if (id === currentId || !categories.some((category) => category.id === id)) return;
      scroll.set(currentId, content.scrollTop);
      currentId = id;
      departments.querySelectorAll('[role="tab"]').forEach((button) => {
        const selected = button.dataset.catalogDepartment === id;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && focus) button.focus();
      });
      renderContent();
    }
    departments.addEventListener("click", (event) => {
      const button = event.target.closest("[data-catalog-department]");
      if (button) select(button.dataset.catalogDepartment);
    });
    departments.addEventListener("keydown", (event) => {
      const buttons = [...departments.querySelectorAll('[role="tab"]')], index = buttons.indexOf(event.target);
      if (index < 0 || !buttons.length) return;
      let next = index;
      if (event.key === "ArrowDown") next = (index + 1) % buttons.length;
      else if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else return;
      event.preventDefault();
      select(buttons[next].dataset.catalogDepartment, true);
    });
    renderDepartments();
    return { setQuery(value) { currentQuery = String(value || "").trim().toLocaleLowerCase(); renderDepartments(); }, select };
  }

  window.TabanjiCatalogBrowserCore = { mount, slugify, categoryUrl, subcategoryUrl };
})();
