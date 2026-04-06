import React, { createContext, useContext, useState, useCallback } from 'react';
import { t } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('vse_lang') || 'en');

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('vse_lang', next);
      return next;
    });
  }, []);

  const translate = useCallback((key) => t(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
