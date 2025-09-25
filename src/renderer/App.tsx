import React, { useState, useEffect } from 'react';
import './styles/App.css';
import './styles/TranscriptionUploader.css';
import './styles/TranscriptionHistory.css';
import TranscriptionUploader from './components/TranscriptionUploader';
import TranscriptionHistory from './components/TranscriptionHistory';

function App() {
  const [isElectronReady, setIsElectronReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'uploader' | 'history'>('home');
  const [selectedTranscriptionDetails, setSelectedTranscriptionDetails] = useState<any>(null);

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

  const handleViewTranscriptionDetails = (transcriptionResult: any) => {
    setSelectedTranscriptionDetails(transcriptionResult);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'uploader':
        return (
          <div className="transcription-section">
            <TranscriptionUploader 
              onTranscriptionStart={(id) => {
                console.log('Transcripción iniciada:', id);
              }}
              onTranscriptionComplete={(result) => {
                console.log('Transcripción completada:', result);
              }}
            />
          </div>
        );

      case 'history':
        if (selectedTranscriptionDetails) {
          return (
            <div className="transcription-details">
              <div className="details-header">
                <button 
                  className="back-button"
                  onClick={() => setSelectedTranscriptionDetails(null)}
                >
                  ← Volver al historial
                </button>
                <h2>Detalles de Transcripción</h2>
              </div>
              
              <div className="transcription-result">
                <h4>Resultado de la transcripción:</h4>
                <div className="result-content">
                  <div className="result-text">
                    <h5>Texto:</h5>
                    <p>{selectedTranscriptionDetails.text}</p>
                  </div>
                  
                  {selectedTranscriptionDetails.segments && selectedTranscriptionDetails.segments.length > 0 && (
                    <div className="result-segments">
                      <h5>Segmentos con timestamps:</h5>
                      <div className="segments-list">
                        {selectedTranscriptionDetails.segments.map((segment: any, index: number) => (
                          <div key={index} className="segment-item">
                            <span className="segment-time">
                              {Math.floor(segment.start)}s - {Math.floor(segment.end)}s:
                            </span>
                            <span className="segment-text">{segment.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="result-metadata">
                    <p><strong>Idioma:</strong> {selectedTranscriptionDetails.language || 'No detectado'}</p>
                    <p><strong>Duración:</strong> {selectedTranscriptionDetails.duration || 0}s</p>
                    <p><strong>Confianza:</strong> {Math.round((selectedTranscriptionDetails.confidence || 0) * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return <TranscriptionHistory onViewDetails={handleViewTranscriptionDetails} />;

      default:
        return (
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

            {isElectronReady && (
              <div className="action-section">
                <button 
                  className="start-button"
                  onClick={() => setActiveTab('uploader')}
                >
                  🚀 Comenzar Transcripción
                </button>
                
                <button 
                  className="history-button"
                  onClick={() => setActiveTab('history')}
                >
                  📋 Ver Historial
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-info">
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
          </div>

          {isElectronReady && (
            <nav className="main-nav">
              <button 
                className={`nav-button ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('home');
                  setSelectedTranscriptionDetails(null);
                }}
              >
                🏠 Inicio
              </button>
              <button 
                className={`nav-button ${activeTab === 'uploader' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('uploader');
                  setSelectedTranscriptionDetails(null);
                }}
              >
                ⬆️ Subir
              </button>
              <button 
                className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('history');
                  setSelectedTranscriptionDetails(null);
                }}
              >
                📋 Historial
              </button>
            </nav>
          )}
        </div>
      </header>
      
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;