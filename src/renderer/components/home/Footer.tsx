import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="home-footer">
      <div className="container">
        <div className="home-footer-links">
          <a>Privacidad</a>
          <a>Términos</a>
          <a id="contact">Contacto</a>
        </div>
        <p>&copy; 2025 Transcriptor Pro. Solución on-premise para un mundo seguro.</p>
      </div>
    </footer>
  );
};

export default Footer;