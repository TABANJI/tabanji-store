document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const data = typeof products !== "undefined" && Array.isArray(products) ? products : [];
  const store = window.TabanjiStore;
  const deliveryMeta = { courier: { name: "Courier delivery", price: 25, estimate: "1–3 business days" }, pickup: { name: "Pickup point", price: 10, estimate: "2–4 business days" }, store: { name: "Store pickup", price: 0, estimate: "Ready tomorrow" } };
  const paymentNames = { card: "Card", cash: "Cash on delivery", bank: "Bank transfer" };
  let rows = [], totals = null, blocked = false, processing = false, suggestions = [], suggestionIndex = -1, toastTimer;
  const safeGet = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
  const safeSet = (storage, key, value) => { try { storage.setItem(key, value); return true; } catch { return false; } };
  const safeRemove = (storage, key) => { try { storage.removeItem(key); } catch {} };
  const parse = (value, fallback = null) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  const money = (value, currency = "USD") => { try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); } catch { return `${Number(value).toFixed(2)} ${currency}`; } };
  const node = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  function toast(message) { const box = $("status"); if (!box) return; box.textContent = message; box.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove("show"), 2800); }
  function selectedIds() {
    const keys = ["tabanji_cart_selection", "tabanji_cart_selected", "tabanji_selected_cart"];
    for (const key of keys) { const value = parse(safeGet(localStorage, key)); if (Array.isArray(value)) return new Set(value.map(String)); }
    return null;
  }
  function loadRows() {
    if (!store || !data.length) return [];
    const selection = selectedIds();
    return store.getCart().filter((entry) => !selection || selection.has(String(entry.productId))).map((entry) => ({ entry, product: data.find((product) => product.id === entry.productId) }));
  }
  function currentDelivery() { return document.querySelector('input[name="deliveryMethod"]:checked')?.value || "courier"; }
  function currentPayment() { return document.querySelector('input[name="paymentMethod"]:checked')?.value || "card"; }
  function promoValue(subtotal, deliveryPrice) {
    const code = (safeGet(localStorage, "tabanji_promo") || "").toUpperCase(); let discount = 0, delivery = deliveryPrice;
    if (code === "TABANJI10") discount = Math.min(100, subtotal * .1);
    if (code === "WELCOME5") discount = Math.min(50, subtotal * .05);
    if (code === "FREESHIP") delivery = 0;
    return { code: ["TABANJI10", "WELCOME5", "FREESHIP"].includes(code) ? code : "", discount, delivery };
  }
  function calculate() {
    const valid = rows.filter((row) => row.product);
    const currency = valid[0]?.product.currency || "USD";
    const currencies = new Set(valid.map((row) => row.product.currency));
    const subtotal = valid.reduce((sum, row) => sum + row.product.price * row.entry.quantity, 0);
    const productDiscount = valid.reduce((sum, row) => sum + Math.max(0, (Number(row.product.oldPrice) || row.product.price) - row.product.price) * row.entry.quantity, 0);
    const method = currentDelivery(); let baseDelivery = deliveryMeta[method].price;
    if (method === "courier" && subtotal >= 500) baseDelivery = 0;
    const promo = promoValue(subtotal, baseDelivery);
    return { subtotal, productDiscount, promoDiscount: promo.discount, promoCode: promo.code, deliveryPrice: promo.delivery, total: Math.max(0, subtotal + promo.delivery - promo.discount), currency, mixed: currencies.size > 1 };
  }
  function stockProblems() { return rows.filter(({ entry, product }) => !product || !product.inStock || Number(product.stockCount) <= 0 || entry.quantity > product.stockCount); }
  function renderSummary() {
    totals = calculate(); const list = $("summaryItems"); list.replaceChildren();
    rows.filter((row) => row.product).forEach(({ entry, product }) => { const article = node("article", "summary-item"), img = node("img"), info = node("div"), title = node("b", "", product.title), qty = node("small", "", `Quantity: ${entry.quantity}`), price = node("strong", "", money(product.price * entry.quantity, product.currency)); img.src = product.image; img.alt = ""; img.addEventListener("error", () => { img.removeAttribute("src"); }, { once: true }); info.append(title, qty); article.append(img, info, price); list.append(article); });
    $("subtotal").textContent = money(totals.subtotal, totals.currency); $("productDiscount").textContent = `−${money(totals.productDiscount, totals.currency)}`; $("promoDiscount").textContent = `−${money(totals.promoDiscount, totals.currency)}`; $("deliveryPrice").textContent = totals.deliveryPrice ? money(totals.deliveryPrice, totals.currency) : "Free"; $("total").textContent = totals.mixed ? "—" : money(totals.total, totals.currency); $("promoText").textContent = totals.promoCode ? `Promo ${totals.promoCode} applied.` : "Taxes are calculated at checkout.";
    document.querySelector('[data-delivery-price="courier"]').textContent = totals.subtotal >= 500 ? "Free" : money(25, totals.currency);
    checkBlocking();
  }
  function checkBlocking() {
    const issues = stockProblems(), warning = $("blockingWarning"), messages = [];
    if (issues.length) messages.push(issues.some((row) => !row.product) ? "One or more products are unavailable." : "Stock changed for one or more products.");
    if (totals?.mixed) messages.push("Products use different currencies and cannot be combined.");
    blocked = messages.length > 0; warning.hidden = !blocked; warning.replaceChildren();
    if (blocked) { warning.append(document.createTextNode(`${messages.join(" ")} `)); const link = node("a", "", "Review your cart"); link.href = "cart.html"; warning.append(link); }
    updateButton();
  }
  function updateButton() { $("placeOrder").disabled = processing || blocked || !$("agreement").checked; }
  function showConditional(group, value) { group.forEach((name) => { const section = $(`${name}Fields`); if (section) section.hidden = name !== value; }); }
  function setError(input, message) { if (!input) return false; input.setAttribute("aria-invalid", message ? "true" : "false"); const error = $(`${input.id}Error`); if (error) error.textContent = message; return !message; }
  function validateInput(input) {
    let message = "", value = input.value.trim();
    if (input.id === "email" && (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) message = "Enter a valid email address.";
    else if (input.id === "phone" && (!/^[\d\s+()\-]+$/.test(value) || value.replace(/\D/g, "").length < 7)) message = "Enter at least 7 digits using valid phone characters.";
    else if (input.id === "cardNumber" && !/^\d{13,19}$/.test(value.replace(/\s/g, ""))) message = "Enter 13–19 card digits.";
    else if (input.id === "expiry") { const match = /^(\d{2})\/(\d{2})$/.exec(value); if (!match || +match[1] < 1 || +match[1] > 12) message = "Use a valid MM/YY date."; }
    else if (input.id === "cvv" && !/^\d{3,4}$/.test(value)) message = "Enter 3 or 4 digits.";
    else if ((input.required || input.dataset.required === currentDelivery() || input.dataset.required === currentPayment()) && !value) message = "This field is required.";
    else if (input.minLength > 0 && value.length < input.minLength) message = `Enter at least ${input.minLength} characters.`;
    return setError(input, message);
  }
  function validate() {
    let valid = true; const active = [...$("checkoutForm").querySelectorAll("input,select,textarea")].filter((input) => !input.closest("[hidden]") && input.type !== "radio" && input.type !== "checkbox");
    active.forEach((input) => { if (!validateInput(input)) valid = false; });
    if (!$("agreement").checked) { $("agreementError").textContent = "You must accept the Terms and Privacy Policy."; $("agreement").setAttribute("aria-invalid", "true"); valid = false; } else { $("agreementError").textContent = ""; $("agreement").setAttribute("aria-invalid", "false"); }
    rows = loadRows(); if (!rows.length) { toast("Your cart is empty."); valid = false; } renderSummary(); if (blocked) valid = false;
    if (!valid) { const first = $("checkoutForm").querySelector('[aria-invalid="true"]'); first?.scrollIntoView({ behavior: "smooth", block: "center" }); first?.focus({ preventScroll: true }); }
    return valid;
  }
  function restoreProfile() { const profile = parse(safeGet(localStorage, "tabanji_checkout_profile"), {}); if (!profile || typeof profile !== "object") return; const fields = { firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone, address1: profile.address?.address1, address2: profile.address?.address2, courierCity: profile.address?.city, region: profile.address?.region, postalCode: profile.address?.postalCode, country: profile.address?.country }; Object.entries(fields).forEach(([id, value]) => { if ($(id) && typeof value === "string") $(id).value = value; }); }
  function saveProfile() { if (!$("saveProfile").checked) return; const profile = { firstName: $("firstName").value.trim(), lastName: $("lastName").value.trim(), email: $("email").value.trim(), phone: $("phone").value.trim(), address: { address1: $("address1").value.trim(), address2: $("address2").value.trim(), city: $("courierCity").value.trim(), region: $("region").value.trim(), postalCode: $("postalCode").value.trim(), country: $("country").value } }; safeSet(localStorage, "tabanji_checkout_profile", JSON.stringify(profile)); }
  function orderNumber() { const now = new Date(), date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`, suffix = String(Math.floor(1000 + Math.random() * 9000)); return `TBJ-${date}-${suffix}`; }
  function deliveryDetails(method) { if (method === "courier") return { method, name: deliveryMeta[method].name, address1: $("address1").value.trim(), address2: $("address2").value.trim(), city: $("courierCity").value.trim(), region: $("region").value.trim(), postalCode: $("postalCode").value.trim(), country: $("country").value, estimate: deliveryMeta[method].estimate }; if (method === "pickup") return { method, name: deliveryMeta[method].name, city: $("pickupCity").value.trim(), location: $("pickupLocation").value, estimate: deliveryMeta[method].estimate }; return { method, name: deliveryMeta[method].name, location: $("storeLocation").value, estimate: deliveryMeta[method].estimate }; }
  function createOrder() { const method = currentDelivery(), paymentMethod = currentPayment(), number = orderNumber(); return { orderNumber: number, createdAt: new Date().toISOString(), items: rows.map(({ entry, product }) => ({ productId: product.id, title: product.title, quantity: entry.quantity, price: product.price, currency: product.currency })), customer: { firstName: $("firstName").value.trim(), lastName: $("lastName").value.trim(), email: $("email").value.trim(), phone: $("phone").value.trim(), comment: $("comment").value.trim(), callBeforeDelivery: $("callBefore").checked }, delivery: deliveryDetails(method), paymentMethod, subtotal: totals.subtotal, discount: totals.productDiscount, promo: { code: totals.promoCode, discount: totals.promoDiscount }, deliveryPrice: totals.deliveryPrice, total: totals.total, currency: totals.currency, status: "new" }; }
  function complete(order) { safeSet(localStorage, "tabanji_last_order", JSON.stringify(order)); saveProfile(); [...store.getCart()].forEach((item) => store.removeFromCart(item.productId)); safeRemove(localStorage, "tabanji_promo"); store.updateHeaderCounters(); $("checkoutLayout").hidden = true; $("confirmation").hidden = false; $("confirmNumber").textContent = order.orderNumber; $("confirmTotal").textContent = money(order.total, order.currency); $("confirmDelivery").textContent = order.delivery.name; $("confirmPayment").textContent = paymentNames[order.paymentMethod]; $("confirmEstimate").textContent = order.delivery.estimate; $("viewOrder").href = `track-order.html?order=${encodeURIComponent(order.orderNumber)}`; $("confirmation").focus(); }
  function initPage() { rows = loadRows(); if (!store || !data.length) { $("emptyState").hidden = false; $("emptyState").querySelector("p").textContent = "Checkout data is temporarily unavailable. Please return to your cart."; return; } if (!rows.length) { $("emptyState").hidden = false; return; } $("checkoutLayout").hidden = false; const savedDelivery = safeGet(sessionStorage, "tabanji_checkout_delivery") || safeGet(localStorage, "tabanji_checkout_delivery"), savedPayment = safeGet(sessionStorage, "tabanji_checkout_payment") || safeGet(localStorage, "tabanji_checkout_payment"); if (deliveryMeta[savedDelivery]) document.querySelector(`input[name="deliveryMethod"][value="${savedDelivery}"]`).checked = true; if (paymentNames[savedPayment]) document.querySelector(`input[name="paymentMethod"][value="${savedPayment}"]`).checked = true; showConditional(Object.keys(deliveryMeta), currentDelivery()); showConditional(Object.keys(paymentNames), currentPayment()); restoreProfile(); renderSummary(); store.updateHeaderCounters(); }
  document.querySelectorAll('input[name="deliveryMethod"]').forEach((input) => input.addEventListener("change", () => { showConditional(Object.keys(deliveryMeta), currentDelivery()); safeSet(sessionStorage, "tabanji_checkout_delivery", currentDelivery()); renderSummary(); }));
  document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => input.addEventListener("change", () => { showConditional(Object.keys(paymentNames), currentPayment()); safeSet(sessionStorage, "tabanji_checkout_payment", currentPayment()); }));
  $("agreement").addEventListener("change", () => { if ($("agreement").checked) { $("agreementError").textContent = ""; $("agreement").setAttribute("aria-invalid", "false"); } updateButton(); });
  $("checkoutForm").addEventListener("focusout", (event) => { if (event.target.matches("input,select,textarea") && event.target.type !== "checkbox") validateInput(event.target); });
  $("phone").addEventListener("input", (event) => { event.target.value = event.target.value.replace(/[^\d\s+()\-]/g, ""); });
  $("cardNumber").addEventListener("input", (event) => { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); });
  $("expiry").addEventListener("input", (event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 4); event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits; });
  $("cvv").addEventListener("input", (event) => { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4); });
  $("checkoutForm").addEventListener("submit", (event) => { event.preventDefault(); if (processing || !validate()) { toast("Please review the highlighted fields."); return; } processing = true; $("placeOrder").textContent = "Processing..."; updateButton(); setTimeout(() => { rows = loadRows(); renderSummary(); if (stockProblems().length || totals.mixed || !rows.length) { processing = false; $("placeOrder").textContent = "Place order"; updateButton(); toast("Cart availability changed. Please review your cart."); return; } const order = createOrder(); complete(order); processing = false; }, 750); });
  const drawer = $("drawer"), overlay = $("overlay"); function openMenu() { drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); overlay.hidden = false; $("openMenu").setAttribute("aria-expanded", "true"); document.body.classList.add("lock"); $("closeMenu").focus(); } function closeMenu() { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); overlay.hidden = true; $("openMenu").setAttribute("aria-expanded", "false"); document.body.classList.remove("lock"); $("openMenu").focus(); } $("openMenu").addEventListener("click", openMenu); $("closeMenu").addEventListener("click", closeMenu); overlay.addEventListener("click", closeMenu);
  function applyTheme(theme) { document.body.classList.toggle("dark", theme === "dark"); $("theme").textContent = theme === "dark" ? "☀" : "☾"; $("drawerTheme").textContent = theme === "dark" ? "☀ Light theme" : "☾ Dark theme"; } function toggleTheme() { const theme = document.body.classList.contains("dark") ? "light" : "dark"; safeSet(localStorage, "theme", theme); applyTheme(theme); } applyTheme(safeGet(localStorage, "theme") === "dark" ? "dark" : "light"); $("theme").addEventListener("click", toggleTheme); $("drawerTheme").addEventListener("click", toggleTheme);
  const search = $("search"), suggestionBox = $("suggestions"); function closeSuggestions(focus) { suggestionBox.hidden = true; suggestionBox.replaceChildren(); suggestions = []; suggestionIndex = -1; search.setAttribute("aria-expanded", "false"); search.removeAttribute("aria-activedescendant"); if (focus) search.focus(); } function renderSuggestions() { const query = search.value.trim().toLowerCase(); if (!query) { closeSuggestions(); return; } suggestions = data.filter((product) => [product.title, product.brand, product.sku].join(" ").toLowerCase().includes(query)).slice(0, 6); suggestionBox.replaceChildren(); suggestions.forEach((product, index) => { const link = node("a", "", product.title); link.href = `product.html?id=${encodeURIComponent(product.id)}`; link.id = `checkout-suggestion-${index}`; link.dataset.index = String(index); link.setAttribute("role", "option"); suggestionBox.append(link); }); if (!suggestions.length) suggestionBox.append(node("p", "", "No products found")); suggestionBox.hidden = false; search.setAttribute("aria-expanded", "true"); } function moveSuggestion(delta) { const links = [...suggestionBox.querySelectorAll("a")]; if (!links.length) return; suggestionIndex = (suggestionIndex + delta + links.length) % links.length; links.forEach((link, index) => link.classList.toggle("selected", index === suggestionIndex)); search.setAttribute("aria-activedescendant", links[suggestionIndex].id); } search.addEventListener("input", renderSuggestions); search.addEventListener("keydown", (event) => { if (event.key === "ArrowDown") { event.preventDefault(); moveSuggestion(1); } else if (event.key === "ArrowUp") { event.preventDefault(); moveSuggestion(-1); } else if (event.key === "Enter" && suggestionIndex >= 0) { event.preventDefault(); location.href = suggestionBox.querySelectorAll("a")[suggestionIndex].href; } else if (event.key === "Escape") closeSuggestions(true); }); $("searchForm").addEventListener("submit", (event) => { event.preventDefault(); if (search.value.trim()) location.href = `products.html?search=${encodeURIComponent(search.value.trim())}`; }); document.addEventListener("pointerdown", (event) => { if (!event.target.closest(".search")) closeSuggestions(); }); document.addEventListener("keydown", (event) => { if (event.key === "Escape") { if (drawer.classList.contains("open")) closeMenu(); closeSuggestions(); } });
  initPage();
});
