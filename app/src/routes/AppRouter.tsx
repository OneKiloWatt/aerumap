// src/routes/AppRouter.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopPage from "../pages/TopPage";
import RoomPage from "../pages/RoomPage";
import NoLocationPage from "../pages/NoLocationPage";
import GoodbyePage from "../pages/GoodbyePage";
import TermsPage from "../pages/TermsPage";
import ExpiredPage from '../pages/ExpiredPage';

export default function AppRouter() {
  // GitHub Pagesのbasename設定
  // カスタムドメインの場合は空文字、リポジトリ名がパスに含まれる場合はリポジトリ名を設定
  const basename = process.env.NODE_ENV === 'production' 
    ? process.env.PUBLIC_URL || '/aerumap'
    : '';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/no-location" element={<NoLocationPage />} />
        <Route path="/goodbye" element={<GoodbyePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/expired" element={<ExpiredPage />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}
