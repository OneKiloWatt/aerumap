// src/routes/AppRouter.tsx
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import TopPage from "../pages/TopPage";
import RoomPage from "../pages/RoomPage";
import NoLocationPage from "../pages/NoLocationPage";
import GoodbyePage from "../pages/GoodbyePage";
import TermsPage from "../pages/TermsPage";
import ExpiredPage from '../pages/ExpiredPage';

export default function AppRouter() {
  console.log('Using HashRouter - URLs will have # in them');
  
  return (
    <Router>
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
