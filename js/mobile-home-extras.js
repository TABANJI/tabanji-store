const MOBILE_QUERY = "(max-width: 768px)";
const ROOT_ID = "mobileHomeExtras";
const BATCH_SIZE = 8;
let cleanup = null;

function benefitIcon(type) {
  const namespace = "http://www.w3.org/2000/svg", svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const parts = type === "card"
    ? [["rect", { x: 3, y: 7, width: 26, height: 18, rx: 3 }], ["path", { d: "M3 13h26M8 20h7" }]]
    : [["path", { d: "M4 9h15v13H4zM19 13h5l4 5v4h-9z" }], ["circle", { cx: 9, cy: 24, r: 2 }], ["circle", { cx: 23, cy: 24, r: 2 }]];
  parts.forEach(([tag, attributes]) => {
    const node = document.createElementNS(namespace, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    Object.entries({ fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }).forEach(([key, value]) => node.setAttribute(key, value));
    svg.append(node);
  });
  return svg;
}

function viewedRecommendations(items) {
  let recent = [];
  try { const stored = JSON.parse(localStorage.getItem("tabanji_recently_viewed")); recent = Array.isArray(stored) ? stored : []; } catch {}
  const categories = new Set(recent.map(id => items.find(product => product.id === id)?.categoryId).filter(Boolean));
  const seen = new Set(recent), result = [];
  const add = product => { if (product && !seen.has(product.id)) { seen.add(product.id); result.push(product); } };
  [...items].filter(product => categories.has(product.categoryId)).sort((a, b) => b.popularity - a.popularity).forEach(add);
  [...items].filter(product => product.badge === "Bestseller").sort((a, b) => b.popularity - a.popularity).forEach(add);
  [...items].sort((a, b) => b.popularity - a.popularity).forEach(add);
  items.forEach(add);
  return result.slice(0, 8);
}

function bestOffers(items, excluded) {
  const seen = new Set(excluded), result = [];
  const add = product => { if (product && !seen.has(product.id)) { seen.add(product.id); result.push(product); } };
  const discount = product => product.oldPrice > product.price ? 1 - product.price / product.oldPrice : 0;
  [...items].filter(product => discount(product) > 0).sort((a, b) => discount(b) - discount(a) || b.popularity - a.popularity).forEach(add);
  [...items].filter(product => product.badge && product.badge !== "Bestseller").sort((a, b) => b.popularity - a.popularity).forEach(add);
  [...items].filter(product => product.badge === "Bestseller").sort((a, b) => b.popularity - a.popularity).forEach(add);
  [...items].sort((a, b) => b.popularity - a.popularity).forEach(add);
  items.forEach(add);
  return result.slice(0, 204);
}

function textButton(e, label, disabled = false) {
  const button = e("button", "mobile-future-link", label);
  button.type = "button";
  button.disabled = disabled;
  if (disabled) button.setAttribute("aria-label", `${label}, coming soon`);
  return button;
}

function footerGroup(e, a, title, entries) {
  const group = e("section", "mobile-footer-group");
  group.append(e("h3", "", title));
  const list = e("div", "mobile-footer-links");
  entries.forEach(([label, route]) => list.append(route ? a(label, route) : textButton(e, `${label} — Coming soon`, true)));
  group.append(list);
  return group;
}

function socialIcon(label) {
  const namespace = "http://www.w3.org/2000/svg", svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const circle = document.createElementNS(namespace, "circle"), mark = document.createElementNS(namespace, "text");
  Object.entries({ cx: 16, cy: 16, r: 13, fill: "none", stroke: "currentColor", "stroke-width": 2 }).forEach(([key, value]) => circle.setAttribute(key, value));
  Object.entries({ x: 16, y: 20, "text-anchor": "middle", fill: "currentColor", "font-size": 12, "font-weight": 800 }).forEach(([key, value]) => mark.setAttribute(key, value));
  mark.textContent = label === "YouTube" ? "Y" : label.slice(0, 1);
  svg.append(circle, mark);
  return svg;
}

function appControl(e, label) {
  const control = e("button", "mobile-app-control");
  control.type = "button";
  control.disabled = true;
  control.setAttribute("aria-label", `${label}, coming soon`);
  control.append(e("small", "", "Coming soon"), e("strong", "", label));
  return control;
}

export function remove() {
  cleanup?.();
  cleanup = null;
  document.getElementById(ROOT_ID)?.remove();
}

export function mount({ items, card, action, e, a }) {
  if (!matchMedia(MOBILE_QUERY).matches || document.getElementById(ROOT_ID)) return;
  const root = e("div", "mobile-home-extras");
  root.id = ROOT_ID;
  const legacyNodes = [
    "popularCategories",
    "deals",
    "recommended",
    "newArrivals",
    "brands",
    "shopByCategory"
  ].map(id => document.getElementById(id)?.closest("section")).filter(Boolean);
  document.querySelectorAll("main > .container > .why, main > .container > .newsletter, body > footer").forEach(node => legacyNodes.push(node));
  legacyNodes.forEach(node => node.classList.add("mobile-legacy-home-section"));

  const benefits = e("section", "mobile-benefits");
  [["card", "TABANJI Card", "Shopping with benefits"], ["delivery", "Smart Subscription", "Free delivery"]].forEach(([icon, title, subtitle]) => {
    const link = a("", "account.html", "mobile-benefit-card");
    link.setAttribute("aria-label", `${title}: ${subtitle}`);
    const copy = e("span");
    copy.append(e("strong", "", title), e("small", "", subtitle));
    link.append(benefitIcon(icon), copy);
    benefits.append(link);
  });

  const recommendationSection = e("section", "mobile-view-recommendations"), recommendationHeading = e("div", "section-head");
  recommendationHeading.append(e("h2", "", "Recommendations based on your views"));
  const recommendationRow = e("div", "product-row"), recommended = viewedRecommendations(items);
  recommendationRow.id = "mobileViewRecommendations";
  recommendationRow.replaceChildren(...recommended.map(card));
  recommendationRow.addEventListener("click", action);
  recommendationSection.append(recommendationHeading, recommendationRow);

  const offersSection = e("section", "mobile-best-offers"), offersHeading = e("div", "section-head"), offersGrid = e("div", "mobile-offers-grid");
  offersHeading.append(e("h2", "", "Best Offers for You"));
  const offers = bestOffers(items, recommended.map(product => product.id));
  let visible = 0;
  const showMore = e("button", "mobile-show-more", "Show more ↓");
  showMore.type = "button";
  showMore.setAttribute("aria-label", "Show more products");
  const renderBatch = () => {
    const next = offers.slice(visible, visible + BATCH_SIZE);
    offersGrid.append(...next.map(card));
    visible += next.length;
    showMore.hidden = visible >= offers.length;
  };
  offersGrid.addEventListener("click", action);
  showMore.addEventListener("click", renderBatch);
  renderBatch();
  offersSection.append(offersHeading, offersGrid, showMore);

  const story = e("section", "mobile-story is-collapsed"), storyIntro = e("p", "mobile-story-excerpt", "TABANJI is a modern online marketplace created to make everyday shopping simpler, faster and more convenient. Since the beginning, our goal has been to bring useful products, fair choices and a clear shopping experience together in one place. From technology, home products and fashion to tools, gaming, beauty and everyday essentials, TABANJI supports convenient product discovery and simple ordering."), storyMore = e("div", "mobile-story-more");
  storyMore.id = "mobileStoryMore";
  story.append(storyIntro);
  [["Our Vision", "We make useful products easier to discover with clear categories, practical filters and dependable marketplace information."], ["Why TABANJI", "Transparent product details, favorites and comparisons on product pages help shoppers make confident choices."], ["We Care About Your Choice", "Our goal is to help every visitor find suitable products quickly and order through a secure, straightforward experience."], ["Shopping Made Simpler", "From discovery to delivery information, TABANJI keeps the journey organized and easy to understand."]].forEach(([title, copy]) => storyMore.append(e("h3", "", title), e("p", "", copy)));
  storyMore.hidden = true;
  const storyToggle = e("button", "mobile-story-toggle", "Read full ↓");
  storyToggle.type = "button";
  storyToggle.setAttribute("aria-expanded", "false");
  storyToggle.setAttribute("aria-controls", storyMore.id);
  storyToggle.addEventListener("click", () => { const expanded = storyToggle.getAttribute("aria-expanded") !== "true"; storyToggle.setAttribute("aria-expanded", String(expanded)); storyToggle.textContent = expanded ? "Collapse ↑" : "Read full ↓"; storyMore.hidden = !expanded; story.classList.toggle("is-collapsed", !expanded); });
  story.append(storyMore, storyToggle);

  const accentDivider = e("div", "mobile-accent-divider");
  accentDivider.setAttribute("aria-hidden", "true");

  const community = e("section", "mobile-community");
  community.append(e("h2", "", "Follow us"));
  const social = e("div", "mobile-socials");
  ["TikTok", "Telegram", "Facebook", "YouTube", "Instagram", "X", "Viber"].forEach(label => {
    const control = textButton(e, label, true);
    control.replaceChildren(socialIcon(label));
    social.append(control);
  });
  community.append(social, e("h2", "", "Download our apps"));
  const apps = e("div", "mobile-apps");
  apps.append(appControl(e, "App Store"), appControl(e, "Google Play"));
  community.append(apps);

  const footer = e("div", "mobile-info-footer");
  footer.append(
    footerGroup(e, a, "Company", [["About TABANJI", "about.html"], ["Terms of Use", "terms.html"], ["Careers", ""], ["Contacts", "contact.html"], ["All Categories", "catalog.html"]]),
    footerGroup(e, a, "Help", [["Delivery and Payment", "shipping.html"], ["Credit", ""], ["Warranty", ""], ["Returns", "returns.html"], ["Service Centers", ""]]),
    footerGroup(e, a, "Services", [["Bonus Account", ""], ["TABANJI Card", "account.html"], ["Gift Cards", ""], ["TABANJI Exchange", ""], ["Business Customers", ""]])
  );

  const backToTop = e("button", "mobile-back-to-top", "↑");
  backToTop.type = "button";
  backToTop.setAttribute("aria-label", "Back to top");
  backToTop.hidden = true;
  const updateBackToTop = () => { backToTop.hidden = scrollY < 600; };
  backToTop.addEventListener("click", () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  addEventListener("scroll", updateBackToTop, { passive: true });

  root.append(benefits, recommendationSection, offersSection, story, accentDivider, community, footer, backToTop);
  document.querySelector(".hero-layout")?.after(root);
  updateBackToTop();
  cleanup = () => {
    removeEventListener("scroll", updateBackToTop);
    legacyNodes.forEach(node => node.classList.remove("mobile-legacy-home-section"));
  };
}

window.TabanjiMobileHomeExtras = { remove };
