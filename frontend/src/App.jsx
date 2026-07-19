import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Shell from "./shell/Shell";
import RouteLoading from "./shell/RouteLoading";

const HomePage = lazy(() => import("./features/home/HomePage"));
const HSKPage = lazy(() => import("./features/hsk_materials/HSKPage"));
const ListeningPage = lazy(() => import("./features/listening/ListeningPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const PersonalPage = lazy(() => import("./features/personal/PersonalPage"));
const AboutPage = lazy(() => import("./features/about/AboutPage"));

import { LanguageProvider } from "./i18n/LanguageContext";
import { PreferencesProvider } from "./shared/PreferencesContext";


export default function App() {
  return (
    <LanguageProvider>
      <PreferencesProvider>
        {/* HashRouter, not BrowserRouter: packaged builds load via file://,
            where location.pathname is the real filesystem path to
            index.html, not an app route -- HashRouter keeps routing in the
            URL fragment (#/...) instead, which works regardless of how the
            page was loaded. */}
        <HashRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route element={<Shell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/listening" element={<ListeningPage />} />
                <Route path="/listening/:sectionKey" element={<ListeningPage />} />
                <Route path="/personal" element={<PersonalPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/hsk" element={<HSKPage />} />
                <Route path="/hsk/:sectionKey" element={<HSKPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </PreferencesProvider>
    </LanguageProvider>
  );
}
