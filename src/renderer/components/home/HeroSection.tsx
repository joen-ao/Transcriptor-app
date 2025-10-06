import React from 'react';

interface HeroSectionProps {
  onNavigateToUploader: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateToUploader }) => {
  return (
    <section className="home-hero">
      <div className="home-hero-mockup"></div>
      <div className="container">
        <div className="home-hero-content">
          <h1>Transcriptor Pro</h1>
          <p>Transcripción local con IA para privacidad absoluta. Ejecuta offline, sin costos ni compromisos.</p>
          <button 
            className="home-cta-hero"
            onClick={onNavigateToUploader}
          >
            Comenzar Gratuitamente
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;