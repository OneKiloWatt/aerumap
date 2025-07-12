// src/components/Header.tsx
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="/images/icon.svg" alt="アイコン" className="logo-icon" />
          <span className="logo-text">あいまっぷ</span>
        </div>
      </div>
    </header>
  );
}

