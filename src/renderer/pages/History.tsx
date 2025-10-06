import React, { useState, useEffect } from 'react';
import AppNavigation from '../components/shared/AppNavigation';
import '../styles/Home.css';
import '../styles/HistoryPage.css';

interface HistoryProps {
  onNavigateToHome?: () => void;
  onNavigateToUploader?: () => void;
  onNavigateToHistory?: () => void;
}

interface Transcription {
  id: string;
  fileName: string;
  status: string;
  progress: number;
  model: string;
  createdAt: string;
  completedAt: string | null;
  wordCount: number | null;
  duration: number | null;
}

const History: React.FC<HistoryProps> = ({ 
  onNavigateToHome, 
  onNavigateToUploader, 
  onNavigateToHistory 
}) => {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSmoothScroll = (targetId: string) => {
    onNavigateToHome?.();
  };

  // Cargar lista de transcripciones
  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:3001/api/transcription/list');
      if (!response.ok) {
        throw new Error('Error al cargar transcripciones');
      }
      const data = await response.json();
      setTranscriptions(data);
    } catch (error) {
      console.error('Error loading transcriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar texto de transcripción específica
  const loadTranscriptionText = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/transcription/result/${id}`);
      if (!response.ok) {
        throw new Error('Error al cargar texto de transcripción');
      }
      const data = await response.json();
      setTranscriptionText(data.text || 'No hay texto disponible');
      setSelectedTranscription(id);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading transcription text:', error);
      setTranscriptionText('Error al cargar el texto de la transcripción');
      setShowModal(true);
    }
  };

  // Eliminar transcripción
  const deleteTranscription = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:3001/api/transcription/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Error al eliminar transcripción');
      }
      // Recargar lista después de eliminar
      loadTranscriptions();
    } catch (error) {
      console.error('Error deleting transcription:', error);
      alert('Error al eliminar la transcripción');
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear duración
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtener estado con color
  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="status-badge completed">Completado</span>;
      case 'PROCESSING':
        return <span className="status-badge processing">Procesando ({progress}%)</span>;
      case 'FAILED':
        return <span className="status-badge failed">Error</span>;
      case 'PENDING':
        return <span className="status-badge pending">Pendiente</span>;
      default:
        return <span className="status-badge unknown">{status}</span>;
    }
  };

  useEffect(() => {
    loadTranscriptions();
  }, []);

  return (
    <div className="history-page">
      <AppNavigation 
        currentPage="history"
        onNavigateToHome={onNavigateToHome}
        onNavigateToUploader={onNavigateToUploader}
        onNavigateToHistory={onNavigateToHistory}
        onSmoothScroll={handleSmoothScroll}
      />
      
      <main className="history-main">
        <section className="history-section">
          <div className="history-header">
            <h1 className="history-title">Historial de Transcripciones</h1>
            <button 
              className="refresh-btn"
              onClick={loadTranscriptions}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Cargando transcripciones...</p>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No hay transcripciones</h3>
              <p>Cuando realices transcripciones, aparecerán aquí.</p>
              <button 
                className="cta-btn"
                onClick={onNavigateToUploader}
              >
                Crear Primera Transcripción
              </button>
            </div>
          ) : (
            <div className="transcriptions-grid">
              {transcriptions.map((transcription) => (
                <div key={transcription.id} className="transcription-card">
                  <div className="card-header">
                    <h3 className="file-name">{transcription.fileName}</h3>
                    {getStatusBadge(transcription.status, transcription.progress)}
                  </div>
                  
                  <div className="card-details">
                    <div className="detail-row">
                      <span className="label">Modelo:</span>
                      <span className="value">{transcription.model || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Creado:</span>
                      <span className="value">{formatDate(transcription.createdAt)}</span>
                    </div>
                    {transcription.completedAt && (
                      <div className="detail-row">
                        <span className="label">Completado:</span>
                        <span className="value">{formatDate(transcription.completedAt)}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Duración:</span>
                      <span className="value">{formatDuration(transcription.duration)}</span>
                    </div>
                    {transcription.wordCount && (
                      <div className="detail-row">
                        <span className="label">Palabras:</span>
                        <span className="value">{transcription.wordCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    {transcription.status === 'COMPLETED' && (
                      <button 
                        className="action-btn view-btn"
                        onClick={() => loadTranscriptionText(transcription.id)}
                      >
                        Ver Texto
                      </button>
                    )}
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteTranscription(transcription.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal para mostrar texto de transcripción */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Texto de Transcripción</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="transcription-text-modal">
                {transcriptionText}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn close-modal-btn"
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>
              <button 
                className="modal-btn copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(transcriptionText);
                  alert('Texto copiado al portapapeles');
                }}
              >
                Copiar Texto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;