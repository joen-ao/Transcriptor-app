import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
const WavDecoder = require('wav-decoder');

// Configure FFmpeg path
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// Import Transformers.js
import { pipeline, AutomaticSpeechRecognitionPipeline, env } from '@xenova/transformers';

// Configure transformers to avoid problematic dependencies
env.allowRemoteModels = true;
env.allowLocalModels = true;

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface WhisperResult {
  text: string;
  segments: WhisperSegment[];
  language: string;
  duration: number;
  confidence: number;
}

export class WhisperService {
  private pipeline: AutomaticSpeechRecognitionPipeline | null = null;
  private isInitialized: boolean = false;
  private modelName: string = 'Xenova/whisper-base';

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Whisper with @xenova/transformers...');
      console.log('This may take a few minutes on first run (downloading model)...');
      
      // Create the ASR pipeline
      this.pipeline = await pipeline('automatic-speech-recognition', this.modelName);
      
      this.isInitialized = true;
      console.log('WhisperService initialized successfully with model:', this.modelName);
    } catch (error) {
      console.error('Failed to initialize WhisperService:', error);
      // Don't throw error, allow fallback to simulation
      this.isInitialized = false;
    }
  }

  private async readAudioFile(wavPath: string): Promise<Float32Array> {
    try {
      const buffer = fs.readFileSync(wavPath);
      const audioData = await WavDecoder.decode(buffer);
      
      // Convert to mono if stereo
      let audioArray = audioData.channelData[0]; // Use first channel
      
      // Ensure sample rate is 16kHz (Whisper requirement)
      if (audioData.sampleRate !== 16000) {
        console.warn(`Audio sample rate is ${audioData.sampleRate}Hz, expected 16000Hz`);
      }
      
      return new Float32Array(audioArray);
    } catch (error) {
      console.error('Error reading WAV file:', error);
      throw new Error(`Failed to read audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async convertToWav(inputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create proper output path
      const outputPath = inputPath + '.wav';
      console.log(`Converting ${inputPath} to ${outputPath}`);
      
      // Verify input file exists
      if (!fs.existsSync(inputPath)) {
        reject(new Error(`Input file does not exist: ${inputPath}`));
        return;
      }
      
      ffmpeg(inputPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('end', () => {
          console.log('Audio conversion completed');
          resolve(outputPath);
        })
        .on('error', (err: any) => {
          console.error('FFmpeg conversion error:', err);
          console.error('FFmpeg stderr:', err.stderr || 'No stderr available');
          reject(new Error(`FFmpeg conversion failed: ${err.message}`));
        })
        .on('start', (commandLine: string) => {
          console.log('FFmpeg command:', commandLine);
        })
        .save(outputPath);
    });
  }

  async transcribeAudio(
    filePath: string, 
    options: {
      language?: string;
      model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
      progressCallback?: (progress: number) => void;
    } = {}
  ): Promise<WhisperResult> {
    if (!this.isInitialized || !this.pipeline) {
      throw new Error('WhisperService not initialized');
    }

    try {
      const { language = 'auto', progressCallback } = options;
      
      // Convert to WAV format if needed
      let audioPath = filePath;
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext !== '.wav') {
        console.log('Converting audio to WAV format...');
        progressCallback?.(20);
        audioPath = await this.convertToWav(filePath);
      }

      progressCallback?.(40);

      console.log('Starting Whisper transcription with Transformers.js...');
      console.log('Audio file path:', audioPath);
      
      progressCallback?.(50);
      
      let result;
      try {
        // Read the audio data as Float32Array
        console.log('Reading audio file...');
        const audioData = await this.readAudioFile(audioPath);
        console.log('Audio data loaded, samples:', audioData.length);
        
        progressCallback?.(70);

        // Transcribe with Whisper using audio data
        console.log('Running Whisper transcription...');
        result = await this.pipeline(audioData, {
          language: 'es',  // Force Spanish
          return_timestamps: true,
        });
        
        console.log('Transformers.js raw result:', result);
      } catch (whisperError) {
        console.error('Transformers.js execution error:', whisperError);
        throw new Error(`Whisper execution failed: ${whisperError instanceof Error ? whisperError.message : 'Unknown Whisper error'}`);
      }

      progressCallback?.(85);

      // Parse the result and format it according to our interface
      const transcriptionResult = this.parseWhisperResult(result, audioPath);

      // Cleanup converted WAV file if we created one
      if (audioPath !== filePath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      progressCallback?.(100);

      return transcriptionResult;

    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseWhisperResult(result: any, audioPath: string): WhisperResult {
    try {
      // Get audio duration
      const duration = this.getAudioDuration(audioPath);
      
      // Parse segments from Whisper result
      const segments: WhisperSegment[] = [];
      const fullText: string[] = [];

      console.log('Parsing result type:', typeof result, 'keys:', Object.keys(result || {}));

      if (result) {
        // Handle chunks/segments with timestamps FIRST
        if (result.chunks && Array.isArray(result.chunks)) {
          result.chunks.forEach((chunk: any, index: number) => {
            if (chunk.text && chunk.text.trim()) {
              // Extract timestamp properly
              let startTime = 0;
              let endTime = 10;
              
              if (chunk.timestamp && Array.isArray(chunk.timestamp)) {
                startTime = chunk.timestamp[0] || (index * 30);
                endTime = chunk.timestamp[1] || ((index + 1) * 30);
              }
              
              console.log(`Chunk ${index}: [${startTime}-${endTime}] "${chunk.text.trim()}"`);
              
              const seg: WhisperSegment = {
                start: startTime,
                end: endTime,
                text: chunk.text.trim(),
                confidence: 0.9
              };
              segments.push(seg);
              fullText.push(chunk.text.trim());
            }
          });
        } else if (result.text && result.text.trim()) {
          // No chunks, use the full text as a single segment
          const text = result.text.trim();
          fullText.push(text);
          segments.push({
            start: 0,
            end: duration,
            text: text,
            confidence: 0.9
          });
        }
      }

      const text = fullText.join(' ').trim();
      
      const finalResult = {
        text: text || 'No transcription available',
        segments: segments.length > 0 ? segments : [{
          start: 0,
          end: duration,
          text: text || 'No transcription available',
          confidence: 0.5
        }],
        language: result.language || 'spanish',
        duration,
        confidence: segments.reduce((acc, seg) => acc + (seg.confidence || 0.9), 0) / Math.max(segments.length, 1)
      };
      
      console.log('Final parsed result:', {
        textLength: finalResult.text.length,
        segmentsCount: finalResult.segments.length,
        language: finalResult.language,
        duration: finalResult.duration,
        confidence: finalResult.confidence
      });
      
      return finalResult;

    } catch (error) {
      console.error('Error parsing Whisper result:', error);
      return {
        text: 'Error parsing transcription result',
        segments: [{
          start: 0,
          end: 0,
          text: 'Error parsing transcription result',
          confidence: 0.0
        }],
        language: 'unknown',
        duration: 0,
        confidence: 0.0
      };
    }
  }

  private getAudioDuration(filePath: string): number {
    try {
      // This is a simplified version - in production you might want to use ffprobe
      // For now, we'll return a default duration
      const stats = fs.statSync(filePath);
      // Rough estimate: assume 1MB per minute for compressed audio
      return Math.max(1, Math.floor(stats.size / (1024 * 1024) * 60));
    } catch (error) {
      console.warn('Could not determine audio duration:', error);
      return 60; // Default to 1 minute
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.pipeline !== null;
  }

  getSupportedFormats(): string[] {
    return ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.mp4', '.avi', '.mov', '.mkv', '.webm'];
  }
}