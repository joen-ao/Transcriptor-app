import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { isDev } from './utils/environment';
import { setupIpcHandlers } from './ipc/handlers';
import { ElectronServer } from './server/server';
import { TranscriptionService } from './services/transcription-service';

let mainWindow: BrowserWindow | null = null;
let server: ElectronServer | null = null;
let transcriptionService: TranscriptionService | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    titleBarStyle: 'default',
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Initialize transcription service
    transcriptionService = new TranscriptionService();
    await transcriptionService.initialize();
    console.log('Transcription service initialized');

    // Start the Express server
    server = new ElectronServer();
    const port = await server.start();
    console.log(`Backend server started on port ${port}`);

    // Setup IPC handlers
    setupIpcHandlers();
    
    // Create the main window
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to start application:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // Stop the Express server
  if (server) {
    await server.stop();
  }
});