// src/components/Header.tsx
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src="/images/icon.svg" alt="アイコン" className="logo-icon" />
          <span className="logo-text">あいまっぷ</span>
        </Link>
      </div>
    </header>
  );
}

