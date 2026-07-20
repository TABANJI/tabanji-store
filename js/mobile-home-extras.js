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
  const icons = {
    TikTok: ["0 0 448 512", "M448 209.91a210.06 210.06 0 0 1 -122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"],
    WhatsApp: ["0 0 448 512", "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"],
    Facebook: ["0 0 512 512", "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"],
    YouTube: ["0 0 576 512", "M549.65 124.08c-6.28-23.56-24.74-42.02-48.29-48.29C458.81 64 288 64 288 64S117.19 64 74.64 75.79c-23.56 6.28-42.02 24.74-48.29 48.29C14.63 166.71 14.63 256 14.63 256s0 89.29 11.72 131.92c6.28 23.56 24.74 42.02 48.29 48.29C117.19 448 288 448s170.81 0 213.36-11.79c23.56-6.28 42.02-24.74 48.29-48.29C561.37 345.29 561.37 256 561.37 256s0-89.29-11.72-131.92zM219.37 343.18V168.82L371.24 256l-151.87 87.18z"],
    Instagram: ["0 0 448 512", "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM402.4 344.2c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-135.7 9s-106.2 2.6-135.7-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-135.7s-2.6-106.2 9-135.7c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 135.7-9s106.2-2.6 135.7 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 135.7s2.6 106.3-9 135.7z"],
    X: ["0 0 512 512", "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"],
    Telegram: ["0 0 496 512", "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5L142 284.7l-61.3-19.2c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"]
  };
  const [viewBox, pathData] = icons[label];
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(namespace, "path");
  path.setAttribute("d", pathData);
  svg.append(path);
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
  community.append(e("h2", "", "We’re on social media"));
  const social = e("div", "mobile-socials");
  ["TikTok", "WhatsApp", "Facebook", "YouTube", "Instagram", "X", "Telegram"].forEach(label => {
    const control = textButton(e, label, true);
    control.setAttribute("aria-label", `${label} — Coming soon`);
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
