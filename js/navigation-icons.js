(() => {
  "use strict";

  const CART_PATHS = [
    ["path", { d: "M6 10H12L17 21M17 21H55L50 39C49.4 41.2 47.4 42.8 45.1 43L20 45L16 52H48", stroke: "currentColor", "stroke-width": "4", "stroke-linecap": "round", "stroke-linejoin": "round" }],
    ["path", { d: "M17 21L20 45", stroke: "currentColor", "stroke-width": "4", "stroke-linecap": "round", "stroke-linejoin": "round" }],
    ["circle", { cx: "23", cy: "56", r: "4", fill: "currentColor" }],
    ["circle", { cx: "45", cy: "56", r: "4", fill: "currentColor" }]
  ];
  const NS = "http://www.w3.org/2000/svg";

  function cartIcon() {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("navigation-cart-icon");
    CART_PATHS.forEach(([name, attributes]) => {
      const element = document.createElementNS(NS, name);
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
      svg.append(element);
    });
    return svg;
  }

  function replaceCartGlyph(link, drawer = false) {
    if (link.querySelector(".navigation-cart-icon")) return;
    [...link.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
    const legacyIcon = link.querySelector(":scope > svg:first-child, :scope > span:first-child");
    if (legacyIcon && !legacyIcon.matches("small, [data-counter]")) legacyIcon.remove();
    const icon = cartIcon();
    link.prepend(icon);
    if (drawer) icon.after(document.createTextNode(" Cart"));
    if (!drawer && !link.querySelector("small") && !link.hasAttribute("aria-label")) link.setAttribute("aria-label", "Shopping cart");
  }

  function install() {
    document.querySelectorAll('header a[href="cart.html"]').forEach(link => replaceCartGlyph(link));
    document.querySelectorAll('.drawer a[href="cart.html"], .site-drawer a[href="cart.html"]').forEach(link => replaceCartGlyph(link, true));
  }

  window.TabanjiNavigationIcons = { cartIcon, upgrade: install };

  const style = document.createElement("style");
  style.textContent = ".navigation-cart-icon{display:block;width:26px;height:26px;flex:0 0 26px;color:inherit}.drawer .navigation-cart-icon,.site-drawer .navigation-cart-icon{width:24px;height:24px;flex-basis:24px;margin-right:8px}";
  document.head.append(style);
  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE))) install();
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
  window.dispatchEvent(new CustomEvent("tabanji:navigation-icons-ready"));
})();
