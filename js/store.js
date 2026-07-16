(function () {
  "use strict";
  const KEYS = { cart: "tabanji_cart", favorites: "tabanji_favorites", compare: "tabanji_compare" };

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("tabanji:store-updated", { detail: { key } }));
      return true;
    } catch {
      return false;
    }
  }

  function normalizeId(productId) { return String(productId || "").trim(); }
  function getCart() { return read(KEYS.cart, []).filter((item) => item && normalizeId(item.productId) && Number(item.quantity) > 0); }
  function addToCart(productId, quantity = 1) {
    const id = normalizeId(productId);
    const amount = Math.max(1, Math.floor(Number(quantity) || 1));
    if (!id) return getCart();
    const cart = getCart();
    const current = cart.find((item) => item.productId === id);
    if (current) current.quantity += amount; else cart.push({ productId: id, quantity: amount });
    write(KEYS.cart, cart); updateHeaderCounters(); return cart;
  }
  function removeFromCart(productId) {
    const cart = getCart().filter((item) => item.productId !== normalizeId(productId));
    write(KEYS.cart, cart); updateHeaderCounters(); return cart;
  }
  function updateCartQuantity(productId, quantity) {
    const id = normalizeId(productId);
    const amount = Math.floor(Number(quantity) || 0);
    if (amount <= 0) return removeFromCart(id);
    const cart = getCart();
    const current = cart.find((item) => item.productId === id);
    if (current) current.quantity = amount; else cart.push({ productId: id, quantity: amount });
    write(KEYS.cart, cart); updateHeaderCounters(); return cart;
  }
  function getCartCount() { return getCart().reduce((total, item) => total + item.quantity, 0); }
  function getFavorites() { return [...new Set(read(KEYS.favorites, []).map(normalizeId).filter(Boolean))]; }
  function toggleFavorite(productId) {
    const id = normalizeId(productId); const items = getFavorites(); const index = items.indexOf(id);
    if (index >= 0) items.splice(index, 1); else if (id) items.push(id);
    write(KEYS.favorites, items); updateHeaderCounters(); return index < 0;
  }
  function isFavorite(productId) { return getFavorites().includes(normalizeId(productId)); }
  function getCompare() { return [...new Set(read(KEYS.compare, []).map(normalizeId).filter(Boolean))].slice(0, 4); }
  function toggleCompare(productId) {
    const id = normalizeId(productId); const items = getCompare(); const index = items.indexOf(id);
    if (index >= 0) { items.splice(index, 1); write(KEYS.compare, items); updateHeaderCounters(); return { added: false, limit: false }; }
    if (!id || items.length >= 4) return { added: false, limit: true };
    items.push(id); write(KEYS.compare, items); updateHeaderCounters(); return { added: true, limit: false };
  }
  function isCompared(productId) { return getCompare().includes(normalizeId(productId)); }
  function updateHeaderCounters() {
    const counts = { cart: getCartCount(), favorites: getFavorites().length, compare: getCompare().length };
    document.querySelectorAll("[data-counter]").forEach((element) => {
      const count = counts[element.dataset.counter] || 0;
      element.textContent = String(count);
      element.hidden = count === 0;
    });
  }

  const api = { getCart, addToCart, removeFromCart, updateCartQuantity, getCartCount, getFavorites, toggleFavorite, isFavorite, getCompare, toggleCompare, isCompared, updateHeaderCounters };
  window.TabanjiStore = api;
  Object.assign(window, api);
})();
