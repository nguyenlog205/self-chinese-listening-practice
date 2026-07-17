import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "./shell/Shell";


import HomePage from "./features/home/HomePage";
import HSKPage from './features/hsk_materials/HSKPage';
import ListeningPage from "./features/listening/ListeningPage";
import SettingsPage from "./features/settings/SettingsPage";
import PersonalPage from "./features/personal/PersonalPage";

import AboutPage from "./features/about/AboutPage";


import { LanguageProvider } from "./i18n/LanguageContext";
import { PreferencesProvider } from "./shared/PreferencesContext";


export default function App() {
  return (
    <LanguageProvider>
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/listening" element={<ListeningPage />} />
              <Route path="/personal" element={<PersonalPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/hsk" element={<HSKPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </LanguageProvider>
  );
}
