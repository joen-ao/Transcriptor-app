import { DatabaseService } from './database-service';
import { TranscriptionStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export class TranscriptionService {
  private databaseService: DatabaseService;
  private processingQueue: Map<string, Promise<void>> = new Map();

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async initialize(): Promise<void> {
    await this.databaseService.initialize();
  }

  async startTranscription(filePath: string, fileName: string): Promise<string> {
    // Create database entry
    const transcriptionId = await this.databaseService.createTranscription(fileName, filePath);

    // Start processing asynchronously
    const processingPromise = this.processTranscription(transcriptionId, filePath);
    this.processingQueue.set(transcriptionId, processingPromise);

    // Remove from queue when done
    processingPromise.finally(() => {
      this.processingQueue.delete(transcriptionId);
    });

    return transcriptionId;
  }

  private async processTranscription(transcriptionId: string, filePath: string): Promise<void> {
    try {
      // Update status to processing
      await this.databaseService.updateTranscriptionStatus(
        transcriptionId, 
        TranscriptionStatus.PROCESSING, 
        10
      );

      // Simulate file validation
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > 1000) { // 1GB limit
        throw new Error('File too large (max 1GB)');
      }

      // Update progress
      await this.databaseService.updateTranscriptionStatus(transcriptionId, TranscriptionStatus.PROCESSING, 30);

      // TODO: Here we will integrate with Whisper
      // For now, simulate transcription process
      await this.simulateTranscription(transcriptionId);

      // Cleanup temp file
      if (filePath.includes('temp/')) {
        fs.unlinkSync(filePath);
      }

    } catch (error) {
      console.error(`Transcription failed for ${transcriptionId}:`, error);
      await this.databaseService.updateTranscriptionStatus(
        transcriptionId,
        TranscriptionStatus.FAILED,
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async simulateTranscription(transcriptionId: string): Promise<void> {
    // Simulate processing steps
    const steps = [40, 60, 80, 90, 100];
    
    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await this.databaseService.updateTranscriptionStatus(
        transcriptionId, 
        TranscriptionStatus.PROCESSING, 
        progress
      );
    }

    // Simulate transcription result
    const mockResult = {
      text: 'This is a mock transcription result. In the next sprint, this will be replaced with actual Whisper transcription.',
      segments: [
        {
          start: 0.0,
          end: 5.0,
          text: 'This is a mock transcription result.',
        },
        {
          start: 5.0,
          end: 10.0,
          text: 'In the next sprint, this will be replaced with actual Whisper transcription.',
        }
      ],
      language: 'en',
      duration: 10.0,
      confidence: 0.95
    };

    await this.databaseService.updateTranscriptionResult(
      transcriptionId,
      mockResult.text,
      mockResult.segments,
      mockResult.language,
      mockResult.duration,
      mockResult.confidence
    );
  }

  async getTranscriptionStatus(transcriptionId: string) {
    return await this.databaseService.getTranscriptionStatus(transcriptionId);
  }

  async getTranscriptionResult(transcriptionId: string) {
    return await this.databaseService.getTranscriptionResult(transcriptionId);
  }

  async getAllTranscriptions() {
    return await this.databaseService.getAllTranscriptions();
  }

  async deleteTranscription(transcriptionId: string) {
    return await this.databaseService.deleteTranscription(transcriptionId);
  }
}