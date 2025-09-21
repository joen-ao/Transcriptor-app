import React, { useState, useEffect } from 'react';
import './styles/App.css';

function App() {
  const [isElectronReady, setIsElectronReady] = useState(false);

  useEffect(() => {
    const testElectronAPI = async () => {
      try {
        if (window.electronAPI) {
          const response = await window.electronAPI.ping();
          console.log('Electron API test:', response);
          setIsElectronReady(true);
        }
      } catch (error) {
        console.error('Electron API not available:', error);
      }
    };

    testElectronAPI();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Transcriptor Pro</h1>
        <p>Aplicación de Transcripción Local</p>
        {isElectronReady ? (
          <div className="status success">
            ✅ Electron API conectada
          </div>
        ) : (
          <div className="status loading">
            🔄 Conectando con Electron...
          </div>
        )}
      </header>
      
      <main className="app-main">
        <div className="welcome-section">
          <h2>Bienvenido a Transcriptor Pro</h2>
          <p>
            Tu solución local para transcripción automática de audio y video
            usando inteligencia artificial.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>🎵 Múltiples Formatos</h3>
              <p>Soporte para MP3, WAV, MP4, AVI, MOV</p>
            </div>
            
            <div className="feature-card">
              <h3>🔒 100% Local</h3>
              <p>Tus datos nunca salen de tu equipo</p>
            </div>
            
            <div className="feature-card">
              <h3>⚡ IA Integrada</h3>
              <p>Powered by OpenAI Whisper</p>
            </div>
            
            <div className="feature-card">
              <h3>📄 Exportación</h3>
              <p>TXT, DOCX, SRT, JSON</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;