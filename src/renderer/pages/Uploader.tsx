import React, { useState, useCallback, useRef } from 'react';
import AppNavigation from '../components/shared/AppNavigation';
import '../styles/Home.css';
import '../styles/UploaderPage.css';

interface UploaderProps {
  onNavigateToHome?: () => void;
  onNavigateToUploader?: () => void;
  onNavigateToHistory?: () => void;
}

interface FileItem {
  file: File;
  id: string;
}

type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

const Uploader: React.FC<UploaderProps> = ({ 
  onNavigateToHome, 
  onNavigateToUploader, 
  onNavigateToHistory 
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<WhisperModel>('base');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSmoothScroll = (targetId: string) => {
    onNavigateToHome?.();
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const validFiles = Array.from(selectedFiles).filter(file => {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/avi', 'video/quicktime'];
      return validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|mp4|avi|mov)$/i);
    });
    
    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Función para polling del estado de transcripción
  const pollTranscriptionStatus = async (transcriptionId: string) => {
    const maxAttempts = 120; // 10 minutos máximo (120 * 5 segundos)
    let attempts = 0;
    
    const poll = async (): Promise<void> => {
      try {
        attempts++;
        
        // Consultar estado
        const statusResponse = await fetch(`http://127.0.0.1:3001/api/transcription/status/${transcriptionId}`);
        if (!statusResponse.ok) {
          throw new Error(`Error al consultar estado: ${statusResponse.statusText}`);
        }
        
        const statusData = await statusResponse.json();
        console.log('Estado de transcripción:', statusData);
        
        // Actualizar progreso basado en el estado
        if (statusData.status === 'PROCESSING') {
          // Simular progreso mientras está procesando
          setProgress(prev => Math.min(prev + 2, 95));
        } else if (statusData.status === 'COMPLETED') {
          // Transcripción completada, obtener resultado
          setProgress(100);
          
          const resultResponse = await fetch(`http://127.0.0.1:3001/api/transcription/result/${transcriptionId}`);
          if (!resultResponse.ok) {
            throw new Error(`Error al obtener resultado: ${resultResponse.statusText}`);
          }
          
          const resultData = await resultResponse.json();
          console.log('Resultado de transcripción:', resultData);
          
          if (resultData.text) {
            setTranscription(resultData.text);
          } else {
            setTranscription('Transcripción completada pero no se pudo obtener el texto.');
          }
          
          setIsProcessing(false);
          return; // Terminar polling
        } else if (statusData.status === 'FAILED') {
          setTranscription(`Error en la transcripción: ${statusData.error || 'Error desconocido'}`);
          setIsProcessing(false);
          return; // Terminar polling
        }
        
        // Continuar polling si no está completado y no se alcanzó el máximo de intentos
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Esperar 5 segundos antes del siguiente intento
        } else {
          setTranscription('Tiempo de espera agotado. La transcripción puede estar tardando más de lo esperado.');
          setIsProcessing(false);
        }
        
      } catch (error) {
        console.error('Error en polling:', error);
        setTranscription(`Error al monitorear la transcripción: ${error.message}`);
        setIsProcessing(false);
      }
    };
    
    // Iniciar polling después de un breve delay
    setTimeout(poll, 2000);
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    setTranscription('');
    
    try {
      // Por ahora, procesar solo el primer archivo
      const fileItem = files[0];
      
      // Crear FormData para el upload
      const formData = new FormData();
      formData.append('audio', fileItem.file);
      formData.append('model', selectedModel);
      
      // Upload del archivo al backend
      const response = await fetch('http://127.0.0.1:3001/api/transcription/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error al subir archivo: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Archivo subido:', result);
      
      if (result.success && result.transcriptionId) {
        // Iniciar polling para monitorear el progreso
        setProgress(10); // Progreso inicial después del upload
        pollTranscriptionStatus(result.transcriptionId);
      } else {
        throw new Error('No se recibió ID de transcripción válido');
      }
      
    } catch (error) {
      console.error('Error en la transcripción:', error);
      setTranscription(`Error al procesar el archivo: ${error.message}\n\nAsegúrate de que el servidor backend esté ejecutándose.`);
      setIsProcessing(false);
    }
  };

  const exportTranscription = (format: string) => {
    console.log(`Exportando en formato: ${format}`);
    // Implementar exportación
  };

  const clearAll = () => {
    setFiles([]);
    setTranscription('');
    setProgress(0);
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="uploader-page">
      <AppNavigation 
        currentPage="uploader"
        onNavigateToHome={onNavigateToHome}
        onNavigateToUploader={onNavigateToUploader}
        onNavigateToHistory={onNavigateToHistory}
        onSmoothScroll={handleSmoothScroll}
      />
      <main className="uploader-main">
        <section className="upload-section">
          <h1 className="upload-title">Transcribe tus Archivos</h1>
          <p className="upload-subtitle">
            Arrastra archivos de audio o video aquí, o haz clic para seleccionar. Soporte para MP3, WAV, MP4, AVI, MOV.
          </p>

          {/* Drop Zone */}
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-icon">📁</div>
            <p>{isDragging ? 'Suelta los archivos aquí...' : 'Arrastra archivos o haz clic para seleccionar'}</p>
            <p style={{ fontSize: '0.9rem', color: '#c7c7cc' }}>
              Formatos soportados: MP3, WAV, MP4, AVI, MOV
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="audio/*,video/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
            <button className="upload-btn" onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}>
              Seleccionar Archivos
            </button>
          </div>

          {/* Lista de Archivos */}
          {files.length > 0 && (
            <div className="files-list">
              <h3>Archivos Seleccionados ({files.length})</h3>
              {files.map((fileItem) => (
                <div key={fileItem.id} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">🎵</span>
                    <span>
                      {fileItem.file.name} ({(fileItem.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFile(fileItem.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Configuración */}
          <section className="config-section">
            <h3>Configuración</h3>
            <div className="config-row">
              <label>Modelo Whisper:</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="tiny">Tiny (Rápido, menos preciso - ~39MB)</option>
                <option value="base">Base (Equilibrado - ~74MB)</option>
                <option value="small">Small (Mejor precisión - ~244MB)</option>
                <option value="medium">Medium (Alta precisión - ~769MB)</option>
                <option value="large">Large (Muy preciso - ~1.55GB)</option>
              </select>
            </div>
          </section>

          {/* Botón Procesar */}
          <button 
            className="process-btn" 
            onClick={processFiles}
            disabled={files.length === 0 || isProcessing}
          >
            {isProcessing ? 'Procesando...' : 'Iniciar Transcripción'}
          </button>

          {/* Progreso */}
          {isProcessing && (
            <section className="progress-section active">
              <p className="progress-text">Transcribiendo con IA local (Whisper)...</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p>{Math.round(progress)}% Completado</p>
            </section>
          )}

          {/* Transcripción */}
          {transcription && (
            <section className="transcription-section active">
              <h3 className="transcription-title">Transcripción Generada</h3>
              <div className="transcription-text">{transcription}</div>
              <div className="export-section">
                <button className="export-btn" onClick={() => exportTranscription('txt')}>
                  Exportar TXT
                </button>
                <button className="export-btn" onClick={() => exportTranscription('srt')}>
                  Exportar SRT
                </button>
                <button className="export-btn" onClick={() => exportTranscription('json')}>
                  Exportar JSON
                </button>
                <button className="clear-btn" onClick={clearAll}>
                  Limpiar Todo
                </button>
              </div>
            </section>
          )}
        </section>

        {/* Sección Cómo funciona */}
        <section className="how-it-works-section">
          <div className="how-it-works-container">
            <header className="how-it-works-header">
              <h2 className="how-it-works-title">Cómo convertir audio a texto en 3 pasos</h2>
              <p className="how-it-works-subtitle">
                Transcripción con IA local, rápida y con hasta un 96% de precisión.
              </p>
            </header>

            <div className="steps-grid">
              <article className="step-card">
                <div className="step-content">
                  <div className="step-info">
                    <h3 className="step-title">1. Sube tu archivo</h3>
                    <p className="step-description">
                      Puedes importar tu audio desde archivos locales. Soportamos MP3, WAV, MP4, AVI y MOV. 
                      Procesamiento completamente local y privado.
                    </p>
                  </div>
                </div>
              </article>

              <article className="step-card">
                <div className="step-content">
                  <div className="step-info">
                    <h3 className="step-title">2. Selecciona el modelo</h3>
                    <p className="step-description">
                      Elige entre diferentes modelos de Whisper según tu necesidad: desde Tiny para velocidad 
                      hasta Large para máxima precisión.
                    </p>
                  </div>
                </div>
              </article>

              <article className="step-card step-card-wide">
                <div className="step-content">
                  <div className="step-info">
                    <h3 className="step-title">3. Revisa la transcripción y exporta</h3>
                    <p className="step-description">
                      Una vez completada la transcripción, puedes revisar el texto y exportarlo en formatos 
                      TXT, SRT o JSON según tus necesidades.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Sección Idiomas Admitidos */}
        <section className="languages-section">
          <div className="languages-container">
            <h2 className="languages-title">
              Idiomas admitidos
            </h2>
            <p className="languages-subtitle">
              A continuación se muestra la lista de idiomas que admitimos para transcripción y subtítulos.
            </p>
            <ul className="languages-list">
              <li>
                <div className="language-item">
                  <span>Inglés</span>
                  <div className="flags">
                    <span className="flag">🇺🇸</span>
                    <span className="flag">🇬🇧</span>
                    <span className="flag">🇨🇦</span>
                    <span className="flag">🇦🇺</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Francés</span>
                  <div className="flags">
                    <span className="flag">🇫🇷</span>
                    <span className="flag">🇨🇦</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Español</span>
                  <div className="flags">
                    <span className="flag">🇪🇸</span>
                    <span className="flag">🇲🇽</span>
                    <span className="flag">🇨🇴</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Alemán</span>
                  <div className="flags">
                    <span className="flag">🇩🇪</span>
                    <span className="flag">🇦🇹</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Holandés</span>
                  <div className="flags">
                    <span className="flag">🇳🇱</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Portugués</span>
                  <div className="flags">
                    <span className="flag">🇵🇹</span>
                    <span className="flag">🇧🇷</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Italiano</span>
                  <div className="flags">
                    <span className="flag">🇮🇹</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Polaco</span>
                  <div className="flags">
                    <span className="flag">🇵🇱</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Japonés</span>
                  <div className="flags">
                    <span className="flag">🇯🇵</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Chino</span>
                  <div className="flags">
                    <span className="flag">🇨🇳</span>
                    <span className="flag">🇹🇼</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Árabe</span>
                  <div className="flags">
                    <span className="flag">🇸🇦</span>
                    <span className="flag">🇦🇪</span>
                  </div>
                </div>
              </li>
              <li>
                <div className="language-item">
                  <span>Ruso</span>
                  <div className="flags">
                    <span className="flag">🇷🇺</span>
                  </div>
                </div>
              </li>
            </ul>
            <div className="languages-actions">
              <a className="view-all-link">
                Ver todos los idiomas ▸
              </a>
              <button 
                className="start-btn"
                onClick={onNavigateToUploader}
              >
                Empezar
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Uploader;