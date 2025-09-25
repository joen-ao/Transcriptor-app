import React, { useState, useEffect } from 'react';

interface TranscriptionRecord {
  id: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  model: string | null;
  createdAt: string;
  completedAt: string | null;
  wordCount: number | null;
  duration: number | null;
}

interface TranscriptionHistoryProps {
  onViewDetails?: (transcription: TranscriptionRecord) => void;
}

export const TranscriptionHistory: React.FC<TranscriptionHistoryProps> = ({ onViewDetails }) => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:3001/api/transcription/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcriptions');
      }

      const data = await response.json();
      setTranscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading transcriptions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTranscriptions = transcriptions.filter(t => {
    const matchesSearch = t.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesModel = modelFilter === 'all' || t.model === modelFilter;
    
    return matchesSearch && matchesStatus && matchesModel;
  });

  const handleViewDetails = async (transcription: TranscriptionRecord) => {
    if (transcription.status === 'COMPLETED') {
      try {
        const response = await fetch(`http://127.0.0.1:3001/api/transcription/result/${transcription.id}`);
        if (response.ok) {
          const result = await response.json();
          onViewDetails?.(result);
        }
      } catch (err) {
        console.error('Error fetching transcription details:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
      try {
        const response = await fetch(`http://127.0.0.1:3001/api/transcription/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setTranscriptions(prev => prev.filter(t => t.id !== id));
        } else {
          throw new Error('Failed to delete transcription');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting transcription');
      }
    }
  };

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '✅';
      case 'PROCESSING': return '🔄';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completada';
      case 'PROCESSING': return 'Procesando';
      case 'PENDING': return 'Pendiente';
      case 'FAILED': return 'Fallida';
      default: return status;
    }
  };

  const getModelBadgeColor = (model: string | null) => {
    switch (model) {
      case 'base': return 'model-base';
      case 'small': return 'model-small';
      case 'medium': return 'model-medium';
      case 'large': return 'model-large';
      default: return 'model-unknown';
    }
  };

  if (loading) {
    return (
      <div className="transcription-history">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando transcripciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transcription-history">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar transcripciones</h3>
          <p>{error}</p>
          <button onClick={fetchTranscriptions} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transcription-history">
      <div className="history-header">
        <div className="title-section">
          <h2>Historial de Transcripciones</h2>
          <span className="total-count">{filteredTranscriptions.length} transcripciones</span>
        </div>
        
        <button onClick={fetchTranscriptions} className="refresh-button">
          🔄 Actualizar
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por nombre de archivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="COMPLETED">Completadas</option>
            <option value="PROCESSING">Procesando</option>
            <option value="PENDING">Pendientes</option>
            <option value="FAILED">Fallidas</option>
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los modelos</option>
            <option value="base">Base</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      {filteredTranscriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No hay transcripciones</h3>
          <p>
            {transcriptions.length === 0
              ? 'Aún no has creado ninguna transcripción.'
              : 'No se encontraron transcripciones que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div className="transcriptions-grid">
          {filteredTranscriptions.map((transcription) => (
            <div key={transcription.id} className="transcription-card">
              <div className="card-header">
                <div className="file-info">
                  <h3 className="file-name" title={transcription.fileName}>
                    {transcription.fileName}
                  </h3>
                  <div className="status-info">
                    <span className={`status-badge ${transcription.status.toLowerCase()}`}>
                      {getStatusIcon(transcription.status)} {getStatusText(transcription.status)}
                    </span>
                    {transcription.model && (
                      <span className={`model-badge ${getModelBadgeColor(transcription.model)}`}>
                        {transcription.model.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="card-actions">
                  {transcription.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleViewDetails(transcription)}
                      className="action-button view-button"
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(transcription.id)}
                    className="action-button delete-button"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-content">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Creado:</span>
                    <span className="metadata-value">{formatDate(transcription.createdAt)}</span>
                  </div>
                  
                  {transcription.completedAt && (
                    <div className="metadata-item">
                      <span className="metadata-label">Completado:</span>
                      <span className="metadata-value">{formatDate(transcription.completedAt)}</span>
                    </div>
                  )}

                  {transcription.duration && (
                    <div className="metadata-item">
                      <span className="metadata-label">Duración:</span>
                      <span className="metadata-value">{formatDuration(transcription.duration)}</span>
                    </div>
                  )}

                  {transcription.wordCount && (
                    <div className="metadata-item">
                      <span className="metadata-label">Palabras:</span>
                      <span className="metadata-value">{transcription.wordCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {transcription.status === 'PROCESSING' && (
                  <div className="progress-section">
                    <div className="progress-bar-small">
                      <div 
                        className="progress-fill-small" 
                        style={{ width: `${transcription.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text-small">{transcription.progress}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptionHistory;