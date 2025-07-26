// src/components/Header.tsx
import { Link } from 'react-router-dom';
import './Header.css';
import { getImagePath } from '../utils/imageUtils';

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src={getImagePath("/images/icon.svg")} alt="アイコン" className="logo-icon" />
          <span className="logo-text">あえるまっぷ</span>
        </Link>
      </div>
    </header>
  );
}

