import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Transcriptor Pro Backend',
    version: '1.0.0'
  });
});

healthRouter.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});