export const THEME_KEY = "qwikfiles-theme";

export function resolveDarkMode(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light") return false;
  if (saved === "dark") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDarkMode(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
