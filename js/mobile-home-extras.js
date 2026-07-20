const MOBILE_QUERY = "(max-width: 768px)";
const ROOT_ID = "mobileHomeExtras";

function benefitIcon(type) {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const parts = type === "card"
    ? [["rect", { x: 3, y: 7, width: 26, height: 18, rx: 3 }], ["path", { d: "M3 13h26M8 20h7" }]]
    : [["path", { d: "M4 9h15v13H4zM19 13h5l4 5v4h-9z" }], ["circle", { cx: 9, cy: 24, r: 2 }], ["circle", { cx: 23, cy: 24, r: 2 }]];
  parts.forEach(([tag, attributes]) => {
    const node = document.createElementNS(namespace, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    node.setAttribute("fill", "none");
    node.setAttribute("stroke", "currentColor");
    node.setAttribute("stroke-width", "2");
    node.setAttribute("stroke-linecap", "round");
    node.setAttribute("stroke-linejoin", "round");
    svg.append(node);
  });
  return svg;
}

function recommendations(items) {
  let recent = [];
  try {
    const stored = JSON.parse(localStorage.getItem("tabanji_recently_viewed"));
    recent = Array.isArray(stored) ? stored : [];
  } catch {}
  const categories = new Set(recent.map(id => items.find(product => product.id === id)?.categoryId).filter(Boolean));
  const seen = new Set(recent);
  const result = [];
  const add = product => {
    if (product && !seen.has(product.id)) {
      seen.add(product.id);
      result.push(product);
    }
  };
  [...items].filter(product => categories.has(product.categoryId)).sort((a, b) => b.popularity - a.popularity).forEach(add);
  [...items].filter(product => product.badge === "Bestseller").sort((a, b) => b.popularity - a.popularity).forEach(add);
  [...items].sort((a, b) => b.popularity - a.popularity).forEach(add);
  items.forEach(add);
  return result.slice(0, 8);
}

export function remove() {
  document.getElementById(ROOT_ID)?.remove();
}

export function mount({ items, card, action, e, a }) {
  if (!matchMedia(MOBILE_QUERY).matches || document.getElementById(ROOT_ID)) return;
  const root = e("div", "mobile-home-extras");
  root.id = ROOT_ID;
  const benefits = e("section", "mobile-benefits");
  [["card", "TABANJI Card", "Shopping with benefits"], ["delivery", "Smart Membership", "Free delivery"]]
    .forEach(([icon, title, subtitle]) => {
      const link = a("", "account.html", "mobile-benefit-card");
      link.setAttribute("aria-label", `${title}: ${subtitle}`);
      const copy = e("span");
      copy.append(e("strong", "", title), e("small", "", subtitle));
      link.append(benefitIcon(icon), copy);
      benefits.append(link);
    });
  const section = e("section", "mobile-view-recommendations");
  const heading = e("div", "section-head");
  heading.append(e("h2", "", "Recommendations based on your views"));
  const row = e("div", "product-row");
  row.id = "mobileViewRecommendations";
  row.replaceChildren(...recommendations(items).map(card));
  row.addEventListener("click", action);
  section.append(heading, row);
  root.append(benefits, section);
  document.querySelector(".hero-layout")?.after(root);
}

window.TabanjiMobileHomeExtras = { remove };
