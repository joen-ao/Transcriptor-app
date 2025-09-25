import { Request, Response } from 'express';
import { TranscriptionService } from '../../services/transcription-service';
import { DatabaseService } from '../../services/database-service';

export class TranscriptionController {
  private transcriptionService: TranscriptionService;
  private databaseService: DatabaseService;
  private isInitialized: boolean = false;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.databaseService = new DatabaseService();
    
    // Initialize services asynchronously
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      console.log('Initializing TranscriptionController services...');
      await this.transcriptionService.initialize();
      await this.databaseService.initialize();
      this.isInitialized = true;
      console.log('TranscriptionController services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TranscriptionController services:', error);
      // Don't throw, allow fallback behavior
      this.isInitialized = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    // Wait for initialization if it's still in progress
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!this.isInitialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.isInitialized) {
      console.warn('Services not fully initialized, proceeding anyway');
    }
  }

  async uploadAndTranscribe(req: Request, res: Response): Promise<void> {
    try {
      // Ensure services are initialized
      await this.ensureInitialized();
      
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Get model from request body, default to 'small'
      const selectedModel = req.body.model || 'small';
      console.log('Selected Whisper model:', selectedModel);

      const transcriptionId = await this.transcriptionService.startTranscription(
        req.file.path,
        req.file.originalname,
        selectedModel
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