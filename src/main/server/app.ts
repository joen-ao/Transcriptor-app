import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { transcriptionRouter } from './routes/transcription';
import { healthRouter } from './routes/health';

export function createExpressApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const upload = multer({ 
    dest: 'temp/',
    limits: {
      fileSize: 1000 * 1024 * 1024, // 1GB limit
    }
  });

  app.use('/api/health', healthRouter);
  app.use('/api/transcription', upload.single('audio'), transcriptionRouter);

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  });

  return app;
}