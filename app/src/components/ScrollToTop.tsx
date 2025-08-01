// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // ページ遷移時に画面最上部にスクロール
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
