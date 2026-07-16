import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "./shell/Shell";
import HomePage from "./features/home/HomePage";
import SettingsPage from "./features/settings/SettingsPage";
import { LanguageProvider } from "./i18n/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            {/* /listening route gets added here once we port that feature over */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
