// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  // GitHub Pagesのbasename考慮
  const basename = process.env.NODE_ENV === 'production' 
    ? '/aerumap'
    : '';

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2025 あえるまっぷ. All rights reserved.</p>
        <div className="footer-links">
          <a href="https://github.com/OneKiloWatt/aerumap" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <Link to="/terms">利用規約</Link>
          <Link to="/privacy">プライバシーポリシー</Link>
        </div>
      </div>
    </footer>
  );
}
