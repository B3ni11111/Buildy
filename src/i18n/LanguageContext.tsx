import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { LanguageCode, isRtl } from '../types/language';
import { getLanguage, saveLanguage } from '../utils/language';
import { TRANSLATIONS, TranslationKey } from './translations';

interface LanguageContextType {
  language: LanguageCode;
  dir: 'ltr' | 'rtl';
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => getLanguage());
  const dir: 'ltr' | 'rtl' = isRtl(language) ? 'rtl' : 'ltr';

  // Keep the document itself in sync so native browser behavior (text
  // selection direction, scrollbars, form controls) matches too.
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    saveLanguage(code);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let str = TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          str = str.replace(`{{${name}}}`, String(value));
        }
      }
      return str;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
