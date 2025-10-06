import React from 'react';

interface AppNavigationProps {
  currentPage: 'home' | 'uploader' | 'history';
  onNavigateToHome?: () => void;
  onNavigateToUploader?: () => void;
  onNavigateToHistory?: () => void;
  onSmoothScroll?: (targetId: string) => void;
}

const AppNavigation: React.FC<AppNavigationProps> = ({ 
  currentPage,
  onNavigateToHome,
  onNavigateToUploader, 
  onNavigateToHistory,
  onSmoothScroll
}) => {
  const renderNavLinks = () => {
    if (currentPage === 'home') {
      // En la página home, mostrar navegación de landing
      return (
        <ul className="home-nav-links">
          <li>
            <a onClick={(e) => { e.preventDefault(); onNavigateToHome?.(); }}>
              Home
            </a>
          </li>
          <li>
            <a onClick={(e) => { e.preventDefault(); onSmoothScroll?.('features'); }}>
              Características
            </a>
          </li>
          <li>
            <a onClick={(e) => { e.preventDefault(); onSmoothScroll?.('download'); }}>
              Descargar
            </a>
          </li>
          <li>
            <a onClick={(e) => { e.preventDefault(); onSmoothScroll?.('contact'); }}>
              Contacto
            </a>
          </li>
        </ul>
      );
    } else {
      // En otras páginas (uploader, history), mostrar navegación de app
      return (
        <ul className="home-nav-links">
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); onNavigateToHome?.(); }}
              className={currentPage === 'home' ? 'active' : ''}
            >
              Home
            </a>
          </li>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); onNavigateToUploader?.(); }}
              className={currentPage === 'uploader' ? 'active' : ''}
            >
              Transcribir
            </a>
          </li>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); onNavigateToHistory?.(); }}
              className={currentPage === 'history' ? 'active' : ''}
            >
              Historial
            </a>
          </li>
        </ul>
      );
    }
  };

  const renderActionButton = () => {
    if (currentPage === 'home') {
      return (
        <button 
          className="home-cta-header"
          onClick={onNavigateToUploader}
        >
          Comenzar
        </button>
      );
    } else if (currentPage === 'history') {
      return (
        <button 
          className="home-cta-header"
          onClick={onNavigateToUploader}
        >
          Nueva Transcripción
        </button>
      );
    }
    // En uploader no mostrar botón
    return null;
  };

  return (
    <header className="home-header">
      <nav className="home-nav container">
        <div 
          className="home-logo"
          onClick={onNavigateToHome}
          style={{ cursor: 'pointer' }}
        >
          Transcriptor Pro
        </div>
        {renderNavLinks()}
        {renderActionButton()}
      </nav>
    </header>
  );
};

export default AppNavigation;