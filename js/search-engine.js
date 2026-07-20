(() => {
  "use strict";
  if (window.TabanjiSearchEngine) return;

  const RECENT_KEY = "tabanji_recent_searches";
  const popular = ["iPhone", "gaming laptop", "headphones", "coffee machine", "power station", "smart TV", "office chair"];
  const cache = new WeakMap();
  const products = () => window.TabanjiCatalog?.getProducts?.() || [];
  const categories = () => window.TabanjiCatalog?.getCategories?.() || [];
  const categoryName = (id) => categories().find((category) => category.id === id)?.title || id;
  const readRecent = () => {
    try {
      const value = JSON.parse(localStorage.getItem(RECENT_KEY));
      return Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(0, 10) : [];
    } catch {
      return [];
    }
  };
  const writeRecent = (items) => {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 10))); } catch {}
  };
  const addRecent = (value) => {
    const term = String(value || "").trim();
    if (!term) return;
    writeRecent([term, ...readRecent().filter((item) => item.toLocaleLowerCase() !== term.toLocaleLowerCase())]);
  };
  const clearRecent = () => {
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };
  const searchable = (product) => {
    if (cache.has(product)) return cache.get(product);
    const value = [
      product.title,
      product.brand,
      product.sku,
      product.shortDescription,
      categoryName(product.categoryId),
      product.categoryId,
      product.subcategorySlug,
      product.badge,
      ...Object.entries(product.specifications || {}).flat()
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    cache.set(product, value);
    return value;
  };
  const score = (product, query) => {
    if (!query) return 1;
    const terms = String(query).toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const title = product.title.toLocaleLowerCase();
    const brand = product.brand.toLocaleLowerCase();
    const all = searchable(product);
    if (!terms.every((term) => all.includes(term))) return 0;
    return terms.reduce((sum, term) => sum
      + (title === term ? 20 : title.startsWith(term) ? 12 : title.includes(term) ? 8 : 0)
      + (brand === term ? 10 : brand.includes(term) ? 5 : 0)
      + (product.sku.toLocaleLowerCase().includes(term) ? 6 : 0)
      + (all.includes(term) ? 1 : 0), 0);
  };
  const searchProducts = (query, limit = Infinity) => products()
    .map((product) => ({ product, score: score(product, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity)
    .slice(0, limit)
    .map((result) => result.product);
  const searchCategories = (query, limit = Infinity) => {
    const normalized = String(query || "").trim().toLocaleLowerCase();
    const counts = new Map();
    products().forEach((product) => counts.set(product.categoryId, (counts.get(product.categoryId) || 0) + 1));
    return categories().filter((category) => counts.has(category.id))
      .filter((category) => !normalized || [category.title, category.id, category.description]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized))
      .slice(0, limit)
      .map((category) => ({ category, count: counts.get(category.id) || 0 }));
  };
  const searchBrands = (query, limit = Infinity) => {
    const normalized = String(query || "").trim().toLocaleLowerCase();
    const counts = new Map();
    products().forEach((product) => counts.set(product.brand, (counts.get(product.brand) || 0) + 1));
    return [...counts].filter(([brand]) => !normalized || brand.toLocaleLowerCase().includes(normalized))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([brand, count]) => ({ brand, count }));
  };
  const trending = (limit = 6) => [...products()].sort((a, b) => b.popularity - a.popularity).slice(0, limit);

  window.TabanjiSearchEngine = {
    popular,
    searchable,
    score,
    searchProducts,
    searchCategories,
    searchBrands,
    trending,
    readRecent,
    addRecent,
    clearRecent
  };
})();
