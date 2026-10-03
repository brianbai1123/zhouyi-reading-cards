export const THEME_KEY = "zhouyi-reading-cards:theme";
export const THEMES = ["paper", "celadon", "night"];

export function resolveTheme(query, stored) {
  return THEMES.includes(query)
    ? query
    : THEMES.includes(stored)
      ? stored
      : "paper";
}

export function applyTheme(theme) {
  const resolved = resolveTheme(theme, null);
  if (resolved === "paper") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", resolved);
  }
}

function syncRadios(radios, theme) {
  for (const radio of radios) {
    const selected = radio.value === theme;
    radio.checked = selected;
    radio.setAttribute("aria-checked", String(selected));
  }
}

export function initThemeSwitcher() {
  const radios = [...document.querySelectorAll('input[name="theme"]')];
  const activeTheme = resolveTheme(
    document.documentElement.getAttribute("data-theme"),
    null,
  );

  syncRadios(radios, activeTheme);

  for (const radio of radios) {
    radio.addEventListener("change", (event) => {
      const selected = event.currentTarget;
      if (!selected.checked || !THEMES.includes(selected.value)) return;

      applyTheme(selected.value);
      syncRadios(radios, selected.value);
      try {
        localStorage.setItem(THEME_KEY, selected.value);
      } catch {}
    });
  }
}

if (typeof document !== "undefined") {
  initThemeSwitcher();
}
