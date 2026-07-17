import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Global, real-time-toggleable display preferences (currently just pinyin
// visibility) — rides the same pattern as i18n/LanguageContext.jsx so every
// mounted component reacts immediately to a Settings change, not just ones
// remounted after navigation.
const STORAGE_KEY = "listening-app:show-pinyin";

const PreferencesContext = createContext(null);

function readStoredShowPinyin() {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function PreferencesProvider({ children }) {
  const [showPinyin, setShowPinyinState] = useState(readStoredShowPinyin);

  const setShowPinyin = useCallback((value) => {
    setShowPinyinState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const value = useMemo(() => ({ showPinyin, setShowPinyin }), [showPinyin, setShowPinyin]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
