import { Router } from 'express';
import { TranscriptionController } from '../controllers/transcription';

export const transcriptionRouter = Router();
const transcriptionController = new TranscriptionController();

transcriptionRouter.post('/upload', transcriptionController.uploadAndTranscribe.bind(transcriptionController));
transcriptionRouter.get('/status/:id', transcriptionController.getStatus.bind(transcriptionController));
transcriptionRouter.get('/result/:id', transcriptionController.getResult.bind(transcriptionController));
transcriptionRouter.get('/list', transcriptionController.getList.bind(transcriptionController));
transcriptionRouter.delete('/:id', transcriptionController.delete.bind(transcriptionController));