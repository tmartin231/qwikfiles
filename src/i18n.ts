import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "@/assets/i18n/de.json";
import en from "@/assets/i18n/en.json";

const resources = {
  de: { translation: de as Record<string, unknown> },
  en: { translation: en as Record<string, unknown> },
};

const SUPPORTED_LANGS = ["de", "en"] as const;

function getInitialLanguage(): string {
  if (typeof window === "undefined") return "en";
  // 1. Explizit gespeicherte Sprache bevorzugen (persistente User-Einstellung)
  const saved = localStorage.getItem("qwikfiles-language");
  if (
    saved &&
    SUPPORTED_LANGS.includes(saved as (typeof SUPPORTED_LANGS)[number])
  ) {
    return saved;
  }
  // 2. Fallback: Browsersprache, falls unterstützt
  const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
  if (browserLang === "de" || browserLang === "en") return browserLang;
  // 3. Default
  return "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
