import React from 'react';

interface CTASectionProps {
  onNavigateToUploader: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onNavigateToUploader }) => {
  return (
    <section id="download" className="home-cta-section">
      <div className="container">
        <h2>¿Listo para la Privacidad Total?</h2>
        <p>Instala Transcriptor Pro y eleva tu productividad con IA local.</p>
        <button 
          className="home-cta-hero"
          onClick={onNavigateToUploader}
        >
          Comenzar Ahora
        </button>
      </div>
    </section>
  );
};

export default CTASection;