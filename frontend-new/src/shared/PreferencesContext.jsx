import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Global, real-time-toggleable display preferences (pinyin visibility, script,
// phonetic system) — rides the same pattern as i18n/LanguageContext.jsx so every
// mounted component reacts immediately to a Settings change, not just ones
// remounted after navigation.
const STORAGE_KEY = "listening-app:show-pinyin";
const SCRIPT_MODE_KEY = "listening-app:script-mode";
const PHONETIC_MODE_KEY = "listening-app:phonetic-mode";

const PreferencesContext = createContext(null);

function readStoredShowPinyin() {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

function readStoredScriptMode() {
  if (typeof window === "undefined") return "simplified";
  return window.localStorage.getItem(SCRIPT_MODE_KEY) || "simplified";
}

function readStoredPhoneticMode() {
  if (typeof window === "undefined") return "pinyin";
  return window.localStorage.getItem(PHONETIC_MODE_KEY) || "pinyin";
}

export function PreferencesProvider({ children }) {
  const [showPinyin, setShowPinyinState] = useState(readStoredShowPinyin);
  const [scriptMode, setScriptModeState] = useState(readStoredScriptMode);
  const [phoneticMode, setPhoneticModeState] = useState(readStoredPhoneticMode);

  const setShowPinyin = useCallback((value) => {
    setShowPinyinState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const setScriptMode = useCallback((value) => {
    setScriptModeState(value);
    window.localStorage.setItem(SCRIPT_MODE_KEY, value);
  }, []);

  const setPhoneticMode = useCallback((value) => {
    setPhoneticModeState(value);
    window.localStorage.setItem(PHONETIC_MODE_KEY, value);
  }, []);

  const value = useMemo(
    () => ({
      showPinyin,
      setShowPinyin,
      scriptMode,
      setScriptMode,
      phoneticMode,
      setPhoneticMode,
    }),
    [showPinyin, setShowPinyin, scriptMode, setScriptMode, phoneticMode, setPhoneticMode]
  );

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
