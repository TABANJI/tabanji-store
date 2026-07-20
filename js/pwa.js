document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  import("./mobile-navigation.js?v=7").catch(() => {});
  if (!["http:", "https:"].includes(location.protocol) || !("serviceWorker" in navigator)) return;
  let installEvent = null, refreshRequested = false, reloading = false, primaryHandler = () => {};
  const installSubscribers = new Set();
  const installState = () => matchMedia("(display-mode: standalone)").matches ? "installed" : installEvent ? "available" : "unavailable";
  const notifyInstallState = () => installSubscribers.forEach(subscriber => subscriber(installState()));
  async function installTABANJI() {
    if (!installEvent) return false;
    const prompt = installEvent;
    installEvent = null;
    notifyInstallState();
    try { await prompt.prompt(); await prompt.userChoice; return true; } catch { return false; }
  }
  window.TabanjiPWAInstall = {
    getState: installState,
    install: installTABANJI,
    subscribe(subscriber) { installSubscribers.add(subscriber); subscriber(installState()); return () => installSubscribers.delete(subscriber); }
  };
  window.dispatchEvent(new Event("tabanji:pwa-install-ready"));
  const notice = document.createElement("div"), message = document.createElement("span"), primary = document.createElement("button"), dismiss = document.createElement("button");
  notice.className = "pwa-notice";
  notice.hidden = true;
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  primary.type = "button";
  primary.className = "pwa-primary";
  dismiss.type = "button";
  dismiss.className = "pwa-dismiss";
  dismiss.textContent = "×";
  dismiss.setAttribute("aria-label", "Dismiss notification");
  notice.append(message, primary, dismiss);
  document.body.append(notice);
  function hide() { notice.hidden = true; }
  function show(text, action, handler) { message.textContent = text; primary.textContent = action; primaryHandler = handler; notice.hidden = false; }
  primary.addEventListener("click", () => primaryHandler());
  dismiss.addEventListener("click", hide);
  notice.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); hide(); } });
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    if (matchMedia("(display-mode: standalone)").matches) return;
    installEvent = event;
    notifyInstallState();
    show("Install TABANJI for quick access.", "Install app", async () => {
      hide();
      await installTABANJI();
    });
  });
  window.addEventListener("appinstalled", () => { installEvent = null; hide(); notifyInstallState(); });
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (refreshRequested && !reloading) { reloading = true; location.reload(); } });
  navigator.serviceWorker.register("./service-worker.js").then(registration => {
    function offerUpdate(worker) { show("New version available", "Reload", () => { refreshRequested = true; hide(); worker.postMessage({ type: "SKIP_WAITING" }); }); }
    if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker); });
    });
  }).catch(() => {});
});
