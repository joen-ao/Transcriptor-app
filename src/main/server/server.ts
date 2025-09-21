import { createExpressApp } from './app';
import { Server } from 'http';

export class ElectronServer {
  private server: Server | null = null;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
  }

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const app = createExpressApp();
      
      this.server = app.listen(this.port, '127.0.0.1', () => {
        console.log(`Transcriptor Pro backend running on http://127.0.0.1:${this.port}`);
        resolve(this.port);
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${this.port} is busy, trying ${this.port + 1}`);
          this.port += 1;
          this.server = app.listen(this.port, '127.0.0.1', () => {
            console.log(`Transcriptor Pro backend running on http://127.0.0.1:${this.port}`);
            resolve(this.port);
          });
        } else {
          reject(error);
        }
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Transcriptor Pro backend stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.port;
  }
}