import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export function setupIpcHandlers(): void {
  ipcMain.handle('ping', () => {
    console.log('Ping received from renderer');
    return 'pong';
  });

  // Backend server info
  ipcMain.handle('backend:info', () => {
    return {
      port: 3001,
      baseUrl: 'http://127.0.0.1:3001'
    };
  });

  // File operations
  ipcMain.handle('file:select', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Seleccionar archivo de audio/video',
      filters: [
        {
          name: 'Audio/Video',
          extensions: ['mp3', 'wav', 'mp4', 'avi', 'mov', 'mkv', 'flac', 'm4a', 'ogg']
        },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    return {
      path: filePath,
      name: fileName,
      size: stats.size,
      extension: path.extname(filePath).toLowerCase()
    };
  });

  // File validation
  ipcMain.handle('file:validate', async (event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'File not found' };
      }

      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > 1000) {
        return { valid: false, error: 'File too large (max 1GB)' };
      }

      const allowedExtensions = ['.mp3', '.wav', '.mp4', '.avi', '.mov', '.mkv', '.flac', '.m4a', '.ogg'];
      const extension = path.extname(filePath).toLowerCase();
      
      if (!allowedExtensions.includes(extension)) {
        return { valid: false, error: 'Unsupported file format' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}