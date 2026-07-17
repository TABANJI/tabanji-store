document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const button = document.getElementById("themeToggle");
  const readTheme = () => { try { return localStorage.getItem("theme"); } catch { return null; } };
  const writeTheme = value => { try { localStorage.setItem("theme", value); } catch {} };
  function applyTheme(value) {
    const dark = value === "dark";
    document.body.classList.toggle("dark", dark);
    button.textContent = dark ? "☀" : "☾";
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  applyTheme(readTheme() === "dark" ? "dark" : "light");
  button.addEventListener("click", () => {
    const value = document.body.classList.contains("dark") ? "light" : "dark";
    writeTheme(value);
    applyTheme(value);
  });
});
