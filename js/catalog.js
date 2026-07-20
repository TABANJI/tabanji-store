document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const departments = document.getElementById("departmentList");
  const content = document.getElementById("subcategoryContent");
  const pane = document.getElementById("subcategoryPane");
  const search = document.getElementById("catalogSearch");
  const clear = document.getElementById("clearCatalogSearch");
  const close = document.getElementById("closeCatalog");
  if (!departments || !content) return;
  if (!window.TabanjiCatalogBrowserCore || !window.TabanjiCatalog) {
    const failure = document.createElement("div");
    failure.className = "catalog-load-failure";
    const message = document.createElement("strong");
    message.textContent = "Catalog could not be loaded";
    const reload = document.createElement("button");
    reload.type = "button";
    reload.textContent = "Reload";
    reload.addEventListener("click", () => location.reload());
    failure.append(message, reload);
    departments.replaceChildren();
    content.replaceChildren(failure);
    return;
  }
  departments.classList.add("catalog-browser-departments");
  pane.classList.add("catalog-browser-content");
  const controller = window.TabanjiCatalogBrowserCore.mount({
    departments,
    content,
    idPrefix: "catalogPage",
    activeId: new URLSearchParams(location.search).get("category") || ""
  });
  let timer;
  search?.addEventListener("input", () => {
    clear.hidden = !search.value;
    clearTimeout(timer);
    timer = window.setTimeout(() => controller.setQuery(search.value), 140);
  });
  clear?.addEventListener("click", () => { search.value = ""; clear.hidden = true; controller.setQuery(""); search.focus(); });
  close?.addEventListener("click", () => { if (history.length > 1) history.back(); else location.href = "index.html"; });
  const theme = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  document.body.classList.toggle("dark-mode", theme === "dark" || (!theme && matchMedia("(prefers-color-scheme: dark)").matches));
  window.TabanjiStore?.updateHeaderCounters?.();
});
