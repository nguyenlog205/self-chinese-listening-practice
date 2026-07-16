import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "./shell/Shell";
import HomePage from "./features/home/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<HomePage />} />
          {/* /listening route gets added here once we port that feature over */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}