(() => {
  "use strict";
  if (window.TabanjiCatalog) return;

  const PRODUCT_KEY = "tabanji_admin_products";
  const CATEGORY_KEY = "tabanji_admin_categories";
  const subscribers = new Set();
  let productCache = [];
  let categoryCache = [];
  let signature = "";

  const staticProducts = typeof products !== "undefined" && Array.isArray(products) ? products.map(item => ({ ...item })) : [];
  const staticCategories = typeof categories !== "undefined" && Array.isArray(categories) ? categories.map(item => ({ ...item })) : [];
  const fallbackProducts = () => staticProducts;
  const fallbackCategories = () => staticCategories;
  const readArray = key => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw);
      return Array.isArray(value) && value.length ? value : null;
    } catch {
      return null;
    }
  };
  const text = value => typeof value === "string" ? value.trim() : "";
  const finite = value => Number.isFinite(Number(value));
  function normalizeProduct(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const id = text(value.id), title = text(value.title || value.name), sku = text(value.sku);
    const categoryId = text(value.categoryId || value.category), image = text(value.image);
    const price = Number(value.price), stockCount = Number(value.stockCount ?? value.stock);
    if (!id || !title || !sku || !categoryId || !image || !finite(price) || price < 0 || !finite(stockCount) || stockCount < 0) return null;
    return { ...value, id, title, sku, categoryId, image, price, stockCount, inStock: typeof value.inStock === "boolean" ? value.inStock && stockCount > 0 : stockCount > 0 };
  }
  function normalizeCategory(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const id = text(value.id), title = text(value.title || value.name);
    return id && title ? { ...value, id, title } : null;
  }
  const validUnique = (values, normalize, secondaryKey) => {
    const ids = new Set(), secondary = new Set(), result = [];
    values.forEach(value => {
      const item = normalize(value);
      if (!item || ids.has(item.id)) return;
      const other = secondaryKey ? text(item[secondaryKey]).toLowerCase() : "";
      if (other && secondary.has(other)) return;
      ids.add(item.id);
      if (other) secondary.add(other);
      result.push(item);
    });
    return result;
  };
  function snapshot() {
    const adminProducts = readArray(PRODUCT_KEY), adminCategories = readArray(CATEGORY_KEY);
    return {
      products: validUnique(adminProducts || fallbackProducts(), normalizeProduct, "sku"),
      categories: validUnique(adminCategories || fallbackCategories(), normalizeCategory)
    };
  }
  function refresh(detail = null) {
    const next = snapshot(), nextSignature = JSON.stringify([next.products, next.categories]);
    if (nextSignature === signature) return false;
    productCache = next.products;
    categoryCache = next.categories;
    signature = nextSignature;
    if (typeof products !== "undefined" && Array.isArray(products)) products.splice(0, products.length, ...productCache);
    if (typeof categories !== "undefined" && Array.isArray(categories)) categories.splice(0, categories.length, ...categoryCache);
    subscribers.forEach(callback => {
      try { callback({ products: [...productCache], categories: [...categoryCache], detail }); } catch {}
    });
    return true;
  }
  function subscribe(callback) {
    if (typeof callback !== "function") return () => {};
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }
  window.addEventListener("storage", event => {
    if (event.key === PRODUCT_KEY || event.key === CATEGORY_KEY) {
      const changed = refresh({ entity: event.key === PRODUCT_KEY ? "product" : "category", action: "storage", id: null, timestamp: new Date().toISOString() });
      if (changed && subscribers.size === 0) location.reload();
    }
  });
  window.addEventListener("tabanji:catalog-updated", event => refresh(event.detail || null));
  refresh();
  window.TabanjiCatalog = {
    getProducts: () => [...productCache],
    getProductById: productId => productCache.find(item => item.id === String(productId)) || null,
    getCategories: () => [...categoryCache],
    getCategoryById: categoryId => categoryCache.find(item => item.id === String(categoryId)) || null,
    refresh,
    subscribe
  };
})();
