import React from 'react';

interface HeaderProps {
  onNavigateToUploader: () => void;
  onSmoothScroll: (targetId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToUploader, onSmoothScroll }) => {
  return (
    <header className="home-header">
      <nav className="home-nav container">
        <div className="home-logo">Transcriptor Pro</div>
        <ul className="home-nav-links">
          <li>
            <a onClick={(e) => { e.preventDefault(); onSmoothScroll('features'); }}>
              Características
            </a>
          </li>
          <li>
            <a onClick={(e) => { e.preventDefault(); onSmoothScroll('download'); }}>
              Descargar
            </a>
          </li>
          <li>
            <a onClick={(e) => { e.preventDefault(); onSmoothScroll('contact'); }}>
              Contacto
            </a>
          </li>
        </ul>
        <button 
          className="home-cta-header"
          onClick={onNavigateToUploader}
        >
          Comenzar
        </button>
      </nav>
    </header>
  );
};

export default Header;