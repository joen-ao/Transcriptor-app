import { PrismaClient, TranscriptionStatus } from '@prisma/client';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initialize(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async createTranscription(fileName: string, originalPath: string): Promise<string> {
    const transcription = await this.prisma.transcription.create({
      data: {
        fileName,
        originalPath,
        status: TranscriptionStatus.PENDING,
      },
    });
    return transcription.id;
  }

  async updateTranscriptionStatus(
    id: string, 
    status: TranscriptionStatus, 
    progress?: number,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (status === TranscriptionStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await this.prisma.transcription.update({
      where: { id },
      data: updateData,
    });
  }

  async updateTranscriptionResult(
    id: string,
    text: string,
    segments?: any,
    language?: string,
    duration?: number,
    confidence?: number
  ): Promise<void> {
    await this.prisma.transcription.update({
      where: { id },
      data: {
        text,
        segments,
        language,
        duration,
        confidence,
        wordCount: text.split(' ').length,
        status: TranscriptionStatus.COMPLETED,
        completedAt: new Date(),
        progress: 100,
      },
    });
  }

  async getTranscriptionStatus(id: string) {
    return await this.prisma.transcription.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        status: true,
        progress: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        errorMessage: true,
      },
    });
  }

  async getTranscriptionResult(id: string) {
    return await this.prisma.transcription.findUnique({
      where: { id },
    });
  }

  async getAllTranscriptions() {
    return await this.prisma.transcription.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        status: true,
        progress: true,
        createdAt: true,
        completedAt: true,
        wordCount: true,
        duration: true,
      },
    });
  }

  async deleteTranscription(id: string): Promise<void> {
    await this.prisma.transcription.delete({
      where: { id },
    });
  }
}