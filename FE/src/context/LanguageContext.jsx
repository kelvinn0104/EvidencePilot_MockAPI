import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('app_lang') || 'vi');

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'vi' ? 'en' : 'vi';
      localStorage.setItem('app_lang', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

export default LanguageContext;
