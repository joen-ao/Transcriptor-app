import React, { useState, useCallback } from 'react';

interface TranscriptionUploaderProps {
  onTranscriptionStart?: (id: string) => void;
  onTranscriptionComplete?: (result: any) => void;
}

interface TranscriptionStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string;
  result?: any;
}

export const TranscriptionUploader: React.FC<TranscriptionUploaderProps> = ({
  onTranscriptionStart,
  onTranscriptionComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'base' | 'small' | 'medium' | 'large'>('small');

  const supportedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.mp4', '.avi', '.mov'];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size (1GB limit)
    const maxSize = 1000 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. Máximo 1GB.';
    }

    // Check file format
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedFormats.includes(extension)) {
      return `Formato no soportado. Formatos válidos: ${supportedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('model', selectedModel);

      // Upload to backend
      const response = await fetch('http://127.0.0.1:3001/api/transcription/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const transcriptionId = result.transcriptionId;

      console.log('Transcription started:', transcriptionId);
      onTranscriptionStart?.(transcriptionId);

      // Initialize transcription status
      setCurrentTranscription({
        id: transcriptionId,
        status: 'PENDING',
        progress: 0
      });

      // Start polling for status updates
      pollTranscriptionStatus(transcriptionId);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const pollTranscriptionStatus = async (transcriptionId: string) => {
    const pollInterval = 1000; // Poll every second
    
    const poll = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:3001/api/transcription/status/${transcriptionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get transcription status');
        }

        const statusData = await response.json();
        
        setCurrentTranscription({
          id: transcriptionId,
          status: statusData.status,
          progress: statusData.progress || 0,
          error: statusData.error
        });

        if (statusData.status === 'COMPLETED') {
          // Get the final result
          const resultResponse = await fetch(`http://127.0.0.1:3001/api/transcription/result/${transcriptionId}`);
          if (resultResponse.ok) {
            const result = await resultResponse.json();
            setCurrentTranscription(prev => prev ? { ...prev, result } : null);
            onTranscriptionComplete?.(result);
          }
          return; // Stop polling
        }

        if (statusData.status === 'FAILED') {
          return; // Stop polling
        }

        // Continue polling if still processing
        if (statusData.status === 'PROCESSING' || statusData.status === 'PENDING') {
          setTimeout(poll, pollInterval);
        }

      } catch (err) {
        console.error('Status polling error:', err);
        setError('Error al obtener el estado de la transcripción');
      }
    };

    poll();
  };

  const resetTranscription = () => {
    setCurrentTranscription(null);
    setError(null);
  };

  return (
    <div className="transcription-uploader">
      {!currentTranscription ? (
        <div 
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            {isUploading ? (
              <div className="upload-progress">
                <div className="spinner"></div>
                <p>Subiendo archivo...</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <h3>Arrastra y suelta tu archivo aquí</h3>
                <p>o haz clic para seleccionar</p>
                <input
                  type="file"
                  accept={supportedFormats.join(',')}
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                  id="file-input"
                />
                <label htmlFor="file-input" className="upload-button">
                  Seleccionar archivo
                </label>
                
                <div className="model-selection">
                  <label htmlFor="model-select">Modelo Whisper:</label>
                  <select 
                    id="model-select"
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value as 'base' | 'small' | 'medium' | 'large')}
                    className="model-select"
                  >
                    <option value="base">Base (Rápido - ~8-10 min para 5 min de audio)</option>
                    <option value="small">Small (Balanceado - ~11-13 min, mejor precisión)</option>
                    <option value="medium">Medium (Preciso - ~10-12 min, alta precisión)</option>
                    <option value="large">Large (Muy lento - ~15-20 min, máxima precisión)</option>
                  </select>
                </div>
                
                <div className="supported-formats">
                  <p>Formatos soportados:</p>
                  <span>{supportedFormats.join(', ')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="transcription-status">
          <div className="status-header">
            <h3>Transcribiendo archivo...</h3>
            <button onClick={resetTranscription} className="reset-button">
              Nueva transcripción
            </button>
          </div>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${currentTranscription.progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{currentTranscription.progress}%</span>
          </div>

          <div className="status-info">
            <p className={`status-badge ${currentTranscription.status.toLowerCase()}`}>
              {currentTranscription.status === 'PENDING' && '⏳ Preparando...'}
              {currentTranscription.status === 'PROCESSING' && '🔄 Transcribiendo archivo...'}
              {currentTranscription.status === 'COMPLETED' && '✅ Transcripción completada'}
              {currentTranscription.status === 'FAILED' && '❌ Error'}
            </p>
          </div>

          {currentTranscription.status === 'COMPLETED' && currentTranscription.result && (
            <div className="transcription-result">
              <h4>Resultado de la transcripción:</h4>
              <div className="result-content">
                <div className="result-text">
                  <h5>Texto:</h5>
                  <p>{currentTranscription.result.text}</p>
                </div>
                
                {currentTranscription.result.segments && currentTranscription.result.segments.length > 0 && (
                  <div className="result-segments">
                    <h5>Segmentos con timestamps:</h5>
                    <div className="segments-list">
                      {currentTranscription.result.segments.map((segment: any, index: number) => (
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
                  <p><strong>Idioma:</strong> {currentTranscription.result.language || 'No detectado'}</p>
                  <p><strong>Duración:</strong> {currentTranscription.result.duration || 0}s</p>
                  <p><strong>Confianza:</strong> {Math.round((currentTranscription.result.confidence || 0) * 100)}%</p>
                </div>
              </div>
            </div>
          )}

          {currentTranscription.status === 'FAILED' && (
            <div className="error-message">
              <p>Error en la transcripción: {currentTranscription.error || 'Error desconocido'}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default TranscriptionUploader;