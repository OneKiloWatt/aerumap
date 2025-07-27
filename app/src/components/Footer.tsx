// src/components/Footer.tsx
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
          <a href={`${basename}/docs/TERMS.md`} target="_blank" rel="noopener noreferrer">
            利用規約
          </a>
        </div>
      </div>
    </footer>
  );
}
