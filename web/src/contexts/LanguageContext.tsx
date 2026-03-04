import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { http } from "../api/http";

interface LanguageContextType {
  language: string;
  translations: Record<string, string>;
  isLoading: boolean;
  setLanguage: (lang: string, skipSync?: boolean) => void;
  t: (key: string, params?: Record<string, string>) => string;
  refetchTranslations: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_KEY = "maklr_language";
const TRANSLATIONS_CACHE_KEY = "maklr_translations_cache";
const DEFAULT_LANGUAGE = "en";

function getStoredLanguage(): string {
  return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
}

function getCachedTranslations(lang: string): Record<string, string> {
  const cachedData = localStorage.getItem(TRANSLATIONS_CACHE_KEY);
  if (!cachedData) return {};
  try {
    const parsed = JSON.parse(cachedData);
    return parsed[lang] || {};
  } catch {
    return {};
  }
}

function setCachedTranslations(
  lang: string,
  translations: Record<string, string>,
): void {
  const cachedData = localStorage.getItem(TRANSLATIONS_CACHE_KEY);
  let cache: Record<string, Record<string, string>> = {};
  if (cachedData) {
    try {
      cache = JSON.parse(cachedData);
    } catch {
      cache = {};
    }
  }
  const updatedCache = { ...cache, [lang]: translations };
  localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(updatedCache));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(getStoredLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>(() =>
    getCachedTranslations(getStoredLanguage()),
  );
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchTranslations = useCallback(async (lang: string) => {
    try {
      const response = await http.get<{ translations: Record<string, string> }>(
        `/translations?lang=${lang}`,
      );
      const fresh = response.translations || {};
      setTranslations(fresh);
      setCachedTranslations(lang, fresh);
    } catch (error) {
      console.error("Failed to fetch translations:", error);
    }
  }, []);

  const refetchTranslations = useCallback(async () => {
    setIsLoading(true);
    await fetchTranslations(language);
    setIsLoading(false);
  }, [language, fetchTranslations]);

  useEffect(() => {
    const initFetch = async () => {
      if (!hasFetchedRef.current) {
        setIsLoading(true);
      }
      await fetchTranslations(language);
      hasFetchedRef.current = true;
      setIsLoading(false);
    };
    initFetch();
  }, [language, fetchTranslations]);

  const setLanguage = useCallback((lang: string, skipSync = false) => {
    const cached = getCachedTranslations(lang);
    if (Object.keys(cached).length > 0) {
      setTranslations(cached);
    }

    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);

    if (!skipSync) {
      http.post("/me/language", { language: lang }).catch((error: unknown) => {
        console.error("Failed to update language preference:", error);
      });
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      let text = translations[key] || key;

      if (params) {
        for (const [paramKey, value] of Object.entries(params)) {
          text = text.replaceAll(`{${paramKey}}`, value);
          text = text.replaceAll(`:${paramKey}`, value);
        }
      }

      return text;
    },
    [translations],
  );

  const value: LanguageContextType = {
    language,
    translations,
    isLoading,
    setLanguage,
    t,
    refetchTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
