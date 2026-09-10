import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";

export type Language = "en" | "hi";

interface LanguageState {
  language: Language;
  hasChosenLanguage: boolean;
  ready: boolean;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hasChosenLanguage, setHasChosenLanguage] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("s360_language");
      if (stored === "en" || stored === "hi") {
        await i18n.changeLanguage(stored);
        setLanguageState(stored);
        setHasChosenLanguage(true);
      }
      setReady(true);
    })();
  }, []);

  async function setLanguage(lang: Language) {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem("s360_language", lang);
    setLanguageState(lang);
    setHasChosenLanguage(true);
  }

  return (
    <LanguageContext.Provider value={{ language, hasChosenLanguage, ready, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
