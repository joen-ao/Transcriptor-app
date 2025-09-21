import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Test IPC communication
  ping: () => ipcRenderer.invoke('ping'),
  
  // Backend server info
  backend: {
    getInfo: () => ipcRenderer.invoke('backend:info'),
  },

  // File operations
  file: {
    select: () => ipcRenderer.invoke('file:select'),
    validate: (filePath: string) => ipcRenderer.invoke('file:validate', filePath),
  },

  // Transcription APIs will use HTTP calls to the Express server
  // These are just helper methods to get server info
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;