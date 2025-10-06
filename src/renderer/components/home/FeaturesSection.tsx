import React from 'react';
import FeatureCard from './FeatureCard';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '🎤',
      title: 'Transcripción Automática',
      description: 'OpenAI Whisper local y gratuito para transcripciones precisas de audio y video en tu equipo.'
    },
    {
      icon: '📁',
      title: 'Soporte Multi-Formato',
      description: 'Compatible con MP3, WAV, MP4, AVI, MOV y más. Procesa sin límites en tu hardware.'
    },
    {
      icon: '🖥️',
      title: 'Interfaz Intuitiva',
      description: 'React + TypeScript para una experiencia fluida y multiplataforma en escritorio.'
    },
    {
      icon: '💾',
      title: 'Almacenamiento Local',
      description: 'SQLite segura en tu dispositivo. Todo offline, sin fugas de datos.'
    },
    {
      icon: '📤',
      title: 'Exportación Flexible',
      description: 'TXT, DOCX, SRT, JSON. Adáptate a cualquier flujo de trabajo.'
    },
    {
      icon: '⚙️',
      title: 'Configuración Avanzada',
      description: 'Personaliza idiomas, modelos y lotes. 100% escalable y privado.'
    }
  ];

  return (
    <section id="features" className="home-features">
      <div className="container">
        <h2 className="home-section-title">Características Principales</h2>
        <div className="home-features-grid">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;