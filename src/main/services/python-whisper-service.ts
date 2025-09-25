import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

// Configure FFmpeg path
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// Get FFmpeg directory for environment variable
const ffmpegDir = path.dirname(ffmpegPath);

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

export class PythonWhisperService {
  private isInitialized: boolean = false;
  private pythonCommand: string = 'py'; // Windows uses 'py'

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Python Whisper service...');
      
      // Test if whisper is available
      await this.testWhisperInstallation();
      
      this.isInitialized = true;
      console.log('PythonWhisperService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PythonWhisperService:', error);
      this.isInitialized = false;
    }
  }

  private async testWhisperInstallation(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Testing Whisper installation with command:', this.pythonCommand, '-c "import whisper; print(\'Whisper installed successfully\')"');
      
      // Test import instead of --help to avoid Unicode issues
      const process = spawn(this.pythonCommand, ['-c', 'import whisper; print("Whisper installed successfully")']);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        console.log(`Whisper test process closed with code: ${code}`);
        console.log(`Output: ${output.trim()}`);
        if (errorOutput.trim()) {
          console.log(`Stderr: ${errorOutput.trim()}`);
        }
        
        if (code === 0) {
          console.log('Whisper Python installation verified successfully!');
          resolve();
        } else {
          const errorMsg = `Whisper import test failed with code ${code}. Error: ${errorOutput}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });
      
      process.on('error', (error) => {
        console.error('Failed to start python process:', error);
        reject(new Error(`Failed to start python process: ${error.message}`));
      });
      
      // Set a timeout for the test
      setTimeout(() => {
        process.kill();
        reject(new Error('Whisper installation test timed out'));
      }, 10000);
    });
  }

  async convertToWav(inputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = inputPath + '.wav';
      console.log(`Converting ${inputPath} to ${outputPath}`);
      
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
    if (!this.isInitialized) {
      throw new Error('PythonWhisperService not initialized');
    }

    try {
      const { language = 'es', model = 'base', progressCallback } = options;
      
      // Convert to WAV format if needed
      let audioPath = filePath;
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext !== '.wav') {
        console.log('Converting audio to WAV format...');
        progressCallback?.(20);
        audioPath = await this.convertToWav(filePath);
      }

      progressCallback?.(40);

      // Create output file path for whisper results
      const outputDir = path.dirname(audioPath);
      const outputBaseName = path.basename(audioPath, '.wav');
      const jsonOutputPath = path.join(outputDir, `${outputBaseName}_whisper.json`);

      console.log('Starting Python Whisper transcription...');
      console.log('Audio file path:', audioPath);
      
      progressCallback?.(50);

      // Run whisper with JSON output
      const result = await this.runWhisperCommand(audioPath, {
        language,
        model,
        outputPath: jsonOutputPath,
        progressCallback
      });

      // Parse the JSON result
      const transcriptionResult = await this.parseWhisperJsonResult(jsonOutputPath, audioPath);

      // Cleanup
      if (audioPath !== filePath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      if (fs.existsSync(jsonOutputPath)) {
        fs.unlinkSync(jsonOutputPath);
      }

      progressCallback?.(100);

      return transcriptionResult;

    } catch (error) {
      console.error('Python Whisper transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runWhisperCommand(
    audioPath: string,
    options: {
      language: string;
      model: string;
      outputPath: string;
      progressCallback?: (progress: number) => void;
    }
  ): Promise<void> {
    const { language, model, outputPath, progressCallback } = options;
    
    return new Promise((resolve, reject) => {
      // Whisper command arguments
      const args = [
        '-m', 'whisper',
        audioPath,
        '--language', language,
        '--model', model,
        '--output_format', 'json',
        '--output_dir', path.dirname(outputPath),
        '--verbose', 'False'
      ];

      console.log('Running whisper command:', this.pythonCommand, args.join(' '));
      console.log('FFmpeg path for Whisper:', ffmpegPath);

      // Set up environment with FFmpeg path
      const env: NodeJS.ProcessEnv = { ...process.env };
      env.PATH = `${ffmpegDir}${path.delimiter}${env.PATH}`;

      const whisperProcess = spawn(this.pythonCommand, args, { env });
      
      let output = '';
      let errorOutput = '';
      
      whisperProcess.stdout.on('data', (data: any) => {
        const text = data.toString();
        output += text;
        console.log('Whisper stdout:', text.trim());
        
        // Update progress based on output
        if (text.includes('100%') || text.includes('Done')) {
          progressCallback?.(90);
        } else if (text.includes('50%')) {
          progressCallback?.(75);
        } else if (text.includes('Loading')) {
          progressCallback?.(60);
        }
      });
      
      whisperProcess.stderr.on('data', (data: any) => {
        const text = data.toString();
        errorOutput += text;
        console.log('Whisper stderr:', text.trim());
      });
      
      whisperProcess.on('close', (code: any) => {
        if (code === 0) {
          console.log('Whisper transcription completed successfully');
          resolve();
        } else {
          reject(new Error(`Whisper process failed with code ${code}: ${errorOutput}`));
        }
      });
      
      whisperProcess.on('error', (error: any) => {
        reject(new Error(`Failed to start whisper process: ${error.message}`));
      });
    });
  }

  private async parseWhisperJsonResult(jsonPath: string, audioPath: string): Promise<WhisperResult> {
    try {
      // Whisper outputs JSON with the same base name as input
      const baseName = path.basename(audioPath, '.wav');
      const actualJsonPath = path.join(path.dirname(jsonPath), `${baseName}.json`);
      
      let jsonContent: string;
      
      if (fs.existsSync(actualJsonPath)) {
        jsonContent = fs.readFileSync(actualJsonPath, 'utf8');
      } else if (fs.existsSync(jsonPath)) {
        jsonContent = fs.readFileSync(jsonPath, 'utf8');
      } else {
        throw new Error(`Whisper JSON output not found at ${actualJsonPath} or ${jsonPath}`);
      }

      const whisperResult = JSON.parse(jsonContent);
      console.log('Whisper JSON result keys:', Object.keys(whisperResult));

      const segments: WhisperSegment[] = [];
      let fullText = '';
      
      if (whisperResult.segments && Array.isArray(whisperResult.segments)) {
        whisperResult.segments.forEach((segment: any) => {
          if (segment.text && segment.text.trim()) {
            segments.push({
              start: segment.start || 0,
              end: segment.end || 0,
              text: segment.text.trim(),
              confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.9
            });
          }
        });
        
        fullText = segments.map(s => s.text).join(' ');
      } else if (whisperResult.text) {
        fullText = whisperResult.text.trim();
        // Create a single segment for the entire text
        segments.push({
          start: 0,
          end: this.getAudioDuration(audioPath),
          text: fullText,
          confidence: 0.9
        });
      }

      const result: WhisperResult = {
        text: fullText,
        segments,
        language: whisperResult.language || 'es',
        duration: this.getAudioDuration(audioPath),
        confidence: segments.reduce((acc, seg) => acc + (seg.confidence || 0.9), 0) / Math.max(segments.length, 1)
      };

      console.log('Parsed Whisper result:', {
        textLength: result.text.length,
        segmentsCount: result.segments.length,
        language: result.language,
        duration: result.duration
      });

      return result;

    } catch (error) {
      console.error('Error parsing Whisper JSON result:', error);
      throw new Error(`Failed to parse Whisper result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getAudioDuration(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      // Rough estimate: 16kHz mono WAV is about 32KB per second
      return Math.max(1, Math.floor(stats.size / 32000));
    } catch (error) {
      console.warn('Could not determine audio duration:', error);
      return 60;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getSupportedFormats(): string[] {
    return ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.mp4', '.avi', '.mov', '.mkv', '.webm'];
  }
}