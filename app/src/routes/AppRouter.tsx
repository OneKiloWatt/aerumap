// src/routes/AppRouter.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopPage from "../pages/TopPage";
import RoomPage from "../pages/RoomPage";
import NoLocationPage from "../pages/NoLocationPage";
import GoodbyePage from "../pages/GoodbyePage";
import TermsPage from "../pages/TermsPage";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/no-location" element={<NoLocationPage />} />
        <Route path="/goodbye" element={<GoodbyePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

