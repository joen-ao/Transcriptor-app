import { Request, Response } from 'express';
import { TranscriptionService } from '../../services/transcription-service';
import { DatabaseService } from '../../services/database-service';

export class TranscriptionController {
  private transcriptionService: TranscriptionService;
  private databaseService: DatabaseService;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.databaseService = new DatabaseService();
  }

  async uploadAndTranscribe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const transcriptionId = await this.transcriptionService.startTranscription(
        req.file.path,
        req.file.originalname
      );

      res.json({
        success: true,
        transcriptionId,
        message: 'Transcription started'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Failed to start transcription',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const status = await this.databaseService.getTranscriptionStatus(id);
      
      if (!status) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      res.json(status);
    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  async getResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.databaseService.getTranscriptionResult(id);
      
      if (!result) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Result error:', error);
      res.status(500).json({ error: 'Failed to get result' });
    }
  }

  async getList(req: Request, res: Response): Promise<void> {
    try {
      const transcriptions = await this.databaseService.getAllTranscriptions();
      res.json(transcriptions);
    } catch (error) {
      console.error('List error:', error);
      res.status(500).json({ error: 'Failed to get transcriptions list' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.databaseService.deleteTranscription(id);
      res.json({ success: true, message: 'Transcription deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete transcription' });
    }
  }
}