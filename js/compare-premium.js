document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const controls = byId("controls");
  const bulk = document.querySelector(".bulk");
  const head = byId("compareHead");
  if (!controls || !bulk || !head) return;

  const add = byId("addProduct");
  const oldOnly = byId("onlyDifferences");
  const only = oldOnly.cloneNode(true);
  oldOnly.replaceWith(only);
  const help = byId("differenceHelp");
  const clear = byId("clearCompare");
  const highlight = byId("highlight");
  const print = byId("printCompare");
  const oldShare = byId("shareCompare");
  const share = oldShare.cloneNode(true);
  oldShare.replaceWith(share);

  const toggleTrack = document.createElement("span");
  const toggleThumb = document.createElement("span");
  toggleTrack.className = "toggle-track";
  toggleTrack.setAttribute("aria-hidden", "true");
  toggleTrack.append(toggleThumb);
  only.classList.add("compare-toggle");
  only.prepend(toggleTrack);
  add.textContent = "+ Add product";
  share.textContent = "Share comparison";
  controls.replaceChildren(only, add, share, help);
  bulk.insertBefore(highlight, print);
  bulk.insertBefore(clear, print);

  only.addEventListener("click", () => {
    const next = only.getAttribute("aria-pressed") !== "true";
    only.setAttribute("aria-pressed", String(next));
    try { sessionStorage.setItem("tabanji_compare_only_differences", String(next)); } catch {}
    byId("compareBody")?.querySelectorAll("tr").forEach((row) => {
      const values = [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim().toLowerCase());
      const identical = values.length < 2 || values.every((value) => value === values[0]);
      row.classList.toggle("hidden-row", next && identical);
    });
  });

  const showToast = (message) => {
    const toast = byId("toast");
    if (!toast) return;
    toast.replaceChildren(document.createTextNode(message));
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2500);
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch {}
      field.remove();
      return copied;
    }
  };

  share.addEventListener("click", async () => {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "TABANJI comparison",
          text: "Compare products on TABANJI",
          url
        });
        showToast("Comparison shared.");
      } else {
        const copied = await copyUrl(url);
        showToast(copied ? "Comparison URL copied." : "Unable to copy comparison URL.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Unable to share comparison.");
    }
  });

  let openMenu = null;
  const closeMenu = (restoreFocus = false) => {
    if (!openMenu) return;
    const trigger = openMenu.previousElementSibling;
    openMenu.hidden = true;
    trigger?.setAttribute("aria-expanded", "false");
    openMenu = null;
    if (restoreFocus) trigger?.focus();
  };

  const decorate = () => {
    head.querySelectorAll(".product-head:not([data-premium])").forEach((card, index) => {
      card.dataset.premium = "true";
      const remove = card.querySelector(".remove");
      const productLink = card.querySelector(":scope > a");
      productLink?.querySelector("img")?.classList.add("product-image");
      productLink?.querySelector("h2")?.classList.add("product-title");

      const directSpans = [...card.children].filter((child) => child.tagName === "SPAN");
      directSpans[0]?.classList.add("product-brand");
      directSpans[1]?.classList.add("product-rating");
      directSpans[2]?.classList.add("stock-status");
      const productId = card.querySelector("[data-id]")?.dataset.id;
      const product = window.TabanjiCatalog?.getProducts?.().find((item) => item.id === productId);
      if (product?.oldPrice > product.price) {
        const discount = document.createElement("span");
        discount.className = "discount-badge";
        discount.textContent = `-${Math.round((1 - product.price / product.oldPrice) * 100)}%`;
        card.querySelector(".price")?.append(discount);
      }
      if (!remove) return;

      const menuId = `compare-product-menu-${index}`;
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "product-menu-trigger";
      trigger.dataset.uiAction = "menu";
      trigger.setAttribute("aria-label", "Product actions");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", menuId);
      trigger.textContent = "⋯";

      const menu = document.createElement("div");
      menu.className = "product-menu";
      menu.id = menuId;
      menu.hidden = true;
      menu.setAttribute("role", "menu");

      remove.className = "product-menu-action danger-action";
      remove.textContent = "Remove from comparison";
      remove.setAttribute("role", "menuitem");

      const favorite = document.createElement("button");
      favorite.type = "button";
      favorite.className = "product-menu-action";
      favorite.dataset.uiAction = "favorite";
      favorite.setAttribute("role", "menuitem");
      favorite.textContent = "Add to favorites";
      menu.append(favorite, remove);
      card.append(trigger, menu);
    });
  };

  new MutationObserver(decorate).observe(head, { childList: true, subtree: true });
  decorate();

  head.addEventListener("click", (event) => {
    const action = event.target.closest("[data-ui-action]");
    if (!action) {
      if (event.target.closest('[data-action="remove"]')) closeMenu();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const card = action.closest(".product-head");

    if (action.dataset.uiAction === "menu") {
      const menu = card.querySelector(".product-menu");
      const opening = menu.hidden;
      closeMenu();
      if (opening) {
        menu.hidden = false;
        action.setAttribute("aria-expanded", "true");
        openMenu = menu;
        menu.querySelector("button")?.focus();
      }
    } else if (action.dataset.uiAction === "favorite") {
      card.querySelector('.head-actions [data-action="favorite"]')?.click();
      closeMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (openMenu && !event.target.closest(".product-menu,.product-menu-trigger")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openMenu) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMenu(true);
    }
  }, true);
});
