// src/routes/AppRouter.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import TopPage from "../pages/TopPage";
import RoomPage from "../pages/RoomPage";
import NoLocationPage from "../pages/NoLocationPage";
import GoodbyePage from "../pages/GoodbyePage";
import TermsPage from "../pages/TermsPage";
import ExpiredPage from '../pages/ExpiredPage';
import PrivacyPage from '../pages/PrivacyPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRouter() {
  // GitHub Pagesのbasename設定
  const basename = process.env.PUBLIC_URL || '';

  console.log('Using BrowserRouter with basename:', basename);

  return (
    <Router basename={basename}>
      {/* ページ遷移時に自動で上部にスクロール */}
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/no-location" element={<NoLocationPage />} />
        <Route path="/goodbye" element={<GoodbyePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/expired" element={<ExpiredPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
