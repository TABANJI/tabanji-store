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
  entries.forEach(([label, route]) => {
    if (route) list.append(a(label, route));
    else {
      const control = textButton(e, label, true);
      control.title = "Coming soon";
      control.setAttribute("aria-label", `${label} — Coming soon`);
      list.append(control);
    }
  });
  group.append(list);
  return group;
}

function socialIcon(label) {
  const namespace = "http://www.w3.org/2000/svg", svg = document.createElementNS(namespace, "svg");
  const icons = {
    TikTok: ["0 0 448 512", "M448 209.91a210.06 210.06 0 0 1 -122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"],
    WhatsApp: ["0 0 448 512", "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"],
    Facebook: ["0 0 512 512", "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"],
    X: ["0 0 512 512", "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"],
    Telegram: ["0 0 496 512", "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5L142 284.7l-61.3-19.2c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"]
  };
  if (label === "YouTube") {
    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS(namespace, "path"), polygon = document.createElementNS(namespace, "polygon");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M43.2,12.5c-0.5-1.8-1.9-3.2-3.7-3.7C36.3,8,24,8,24,8s-12.3,0-15.5,0.8 c-1.8,0.5-3.2,1.9-3.7,3.7C4,15.8,4,24,4,24s0,8.2,0.8,11.5c0.5,1.8,1.9,3.2,3.7,3.7C11.7,40,24,40,24,40s12.3,0,15.5-0.8 c1.8-0.5,3.2-1.9,3.7-3.7C44,32.2,44,24,44,24S44,15.8,43.2,12.5z");
    polygon.setAttribute("fill", "var(--surface)");
    polygon.setAttribute("points", "19,31 31,24 19,17");
    svg.append(path, polygon);
    return svg;
  }
  if (label === "Instagram") {
    Object.entries({ viewBox: "0 0 24 24", width: "100%", height: "100%", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" }).forEach(([key, value]) => svg.setAttribute(key, value));
    const rect = document.createElementNS(namespace, "rect"), lens = document.createElementNS(namespace, "path"), dot = document.createElementNS(namespace, "line");
    Object.entries({ x: 2, y: 2, width: 20, height: 20, rx: 5, ry: 5 }).forEach(([key, value]) => rect.setAttribute(key, value));
    lens.setAttribute("d", "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z");
    Object.entries({ x1: 17.5, y1: 6.5, x2: 17.51, y2: 6.5 }).forEach(([key, value]) => dot.setAttribute(key, value));
    svg.append(rect, lens, dot);
    return svg;
  }
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
  const socialLinks = [
    { id: "tiktok", label: "TikTok", url: null },
    { id: "whatsapp", label: "WhatsApp", url: null },
    { id: "facebook", label: "Facebook", url: null },
    { id: "youtube", label: "YouTube", url: null },
    { id: "instagram", label: "Instagram", url: null },
    { id: "x", label: "X", url: null },
    { id: "telegram", label: "Telegram", url: null }
  ];
  socialLinks.forEach(({ id, label, url }) => {
    const control = url ? a("", url, "mobile-future-link") : textButton(e, label, true);
    control.dataset.social = id;
    if (url) {
      control.target = "_blank";
      control.rel = "noopener noreferrer";
      control.setAttribute("aria-label", `Open TABANJI on ${label}`);
    } else control.setAttribute("aria-label", `${label} — Coming soon`);
    control.replaceChildren(socialIcon(label));
    social.append(control);
  });
  const installHeading = e("h2", "", "Get the TABANJI app");
  community.append(social, installHeading);
  const installButton = e("button", "mobile-install-button");
  installButton.type = "button";
  installButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14"/></svg><span>Install TABANJI</span>';
  const installLabel = installButton.querySelector("span"), installStatus = e("div", "mobile-install-status");
  installStatus.hidden = true;
  installStatus.setAttribute("role", "status");
  installStatus.setAttribute("aria-live", "polite");
  let installStatusTimer;
  const showInstallStatus = () => {
    installStatus.textContent = "Install TABANJI from your browser menu.";
    installStatus.hidden = false;
    clearTimeout(installStatusTimer);
    installStatusTimer = setTimeout(() => { installStatus.hidden = true; }, 3200);
  };
  const updateInstallButton = state => {
    installButton.disabled = state === "installed";
    installLabel.textContent = state === "installed" ? "TABANJI is installed" : "Install TABANJI";
  };
  installButton.addEventListener("click", () => {
    const installAPI = window.TabanjiPWAInstall;
    if (installAPI?.getState() === "available") installAPI.install();
    else showInstallStatus();
  });
  let unsubscribeInstall;
  const connectInstall = () => { if (!unsubscribeInstall) unsubscribeInstall = window.TabanjiPWAInstall?.subscribe(updateInstallButton); };
  connectInstall();
  if (!unsubscribeInstall) {
    updateInstallButton(matchMedia("(display-mode: standalone)").matches ? "installed" : "unavailable");
    addEventListener("tabanji:pwa-install-ready", connectInstall, { once: true });
  }
  community.append(installButton, installStatus);

  const footer = e("div", "mobile-info-footer");
  footer.append(
    footerGroup(e, a, "Company", [["About Us", "about.html"], ["Terms of Use", "terms.html"], ["Contacts", "contact.html"], ["All Categories", "catalog.html"]]),
    footerGroup(e, a, "Help", [["Delivery and Payment", "shipping.html"], ["Warranty", ""], ["Returns", "returns.html"], ["Service Centers", ""]]),
    footerGroup(e, a, "Services", [["Bonus Account", ""], ["TABANJI Card", "account.html"], ["Gift Certificates", ""], ["Business Customers", ""]])
  );

  const footerClosing = e("div", "mobile-footer-closing"), payments = e("section", "mobile-payment-methods");
  payments.append(e("h3", "", "Payment methods"));
  const paymentBadges = e("div", "mobile-payment-badges");
  ["Card", "Cash on Delivery", "Bank Transfer"].forEach(label => paymentBadges.append(e("span", "", label)));
  payments.append(paymentBadges);
  const security = e("div", "mobile-security-row");
  security.innerHTML = '<span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>Secure payments</span><span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>SSL protected</span>';
  const copyright = e("div", "mobile-copyright", "© 2026 TABANJI. All rights reserved.");
  footerClosing.append(payments, security, copyright);
  footer.append(footerClosing);

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
    removeEventListener("tabanji:pwa-install-ready", connectInstall);
    clearTimeout(installStatusTimer);
    unsubscribeInstall?.();
    legacyNodes.forEach(node => node.classList.remove("mobile-legacy-home-section"));
  };
}

window.TabanjiMobileHomeExtras = { remove };
