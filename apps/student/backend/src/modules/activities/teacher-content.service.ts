/**
 * Mindforge Backend — Teacher Content Service (Task 8.1–8.3)
 *
 * Handles teacher material upload, file validation, PDF/text parsing,
 * semantic chunking, embedding generation, and material status lifecycle.
 *
 * Architecture ref: §6.1 — TeacherContentService
 * Processing runs as an async in-process job (not blocking the upload response).
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeacherContentRepository } from '../../database/repositories/teacher-content.repository';
import { EmbeddingsRepository } from '../../database/repositories/embeddings.repository';
import { MaterialStatus } from '../../database/entities/teacher-material.entity';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.txt', '.docx']);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const CHUNK_TARGET_CHARS = 2000; // ~500 tokens
const CHUNK_OVERLAP_CHARS = 200; // ~50 tokens

export interface UploadInput {
  teacherId: string;
  syllabusClass: string;
  syllabusSubject: string;
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer };
}

export interface MaterialSummary {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  chunkCount: number;
  uploadedAt: Date;
}

@Injectable()
export class TeacherContentService {
  private readonly logger = new Logger(TeacherContentService.name);
  private readonly storageDir: string;
  private readonly embeddingBaseUrl: string;
  private readonly embeddingApiKey: string;
  private readonly embeddingModel: string;

  constructor(
    private readonly contentRepo: TeacherContentRepository,
    private readonly embeddingsRepo: EmbeddingsRepository,
    private readonly config: ConfigService,
  ) {
    this.storageDir = this.config.get<string>('TEACHER_STORAGE_PATH', './uploads/teacher-materials');
    this.embeddingBaseUrl = this.config.get<string>('ai.baseUrl', 'https://api.openai.com/v1');
    this.embeddingApiKey = this.config.get<string>('ai.apiKey', '');
    this.embeddingModel = this.config.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
  }

  /** Validate and store uploaded file, then kick off async processing */
  async upload(input: UploadInput): Promise<MaterialSummary> {
    this.validateFile(input.file);

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    const ext = path.extname(input.file.originalname).toLowerCase();
    const storageName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const storagePath = path.join(this.storageDir, storageName);

    fs.writeFileSync(storagePath, input.file.buffer);

    const material = await this.contentRepo.create({
      teacherId: input.teacherId,
      syllabusClass: input.syllabusClass,
      syllabusSubject: input.syllabusSubject,
      fileName: input.file.originalname,
      fileType: ext.replace('.', ''),
      storagePath,
      status: MaterialStatus.PROCESSING,
    });

    this.processAsync(material.id, storagePath, ext, input.syllabusClass, input.syllabusSubject)
      .catch((err) => this.logger.error(`Async processing failed for ${material.id}: ${err.message}`));

    return {
      id: material.id,
      fileName: material.fileName,
      fileType: material.fileType,
      status: material.status,
      chunkCount: 0,
      uploadedAt: material.uploadedAt,
    };
  }

  async getMaterials(teacherId: string): Promise<MaterialSummary[]> {
    const materials = await this.contentRepo.findByTeacher(teacherId);
    return materials.map((m) => ({
      id: m.id,
      fileName: m.fileName,
      fileType: m.fileType,
      status: m.status,
      chunkCount: m.chunkCount,
      uploadedAt: m.uploadedAt,
    }));
  }

  async retryProcessing(materialId: string): Promise<void> {
    const material = await this.contentRepo.findById(materialId);
    if (!material || material.status !== MaterialStatus.FAILED) {
      throw new BadRequestException({ code: 'INVALID_RETRY', message: 'Material not found or not in failed state.' });
    }

    await this.contentRepo.updateStatus(materialId, MaterialStatus.PROCESSING);
    const ext = '.' + material.fileType;

    this.processAsync(materialId, material.storagePath, ext, material.syllabusClass, material.syllabusSubject)
      .catch((err) => this.logger.error(`Retry processing failed for ${materialId}: ${err.message}`));
  }

  /** Full async pipeline: parse → chunk → embed → store */
  private async processAsync(
    materialId: string,
    filePath: string,
    ext: string,
    syllabusClass: string,
    syllabusSubject: string,
  ): Promise<void> {
    try {
      const rawText = await this.extractText(filePath, ext);

      if (!rawText.trim()) {
        await this.contentRepo.updateStatus(materialId, MaterialStatus.FAILED, 'No text content extracted from file.');
        return;
      }

      const cleanText = this.cleanText(rawText);
      const chunks = this.chunkText(cleanText);

      if (chunks.length === 0) {
        await this.contentRepo.updateStatus(materialId, MaterialStatus.FAILED, 'No meaningful chunks produced.');
        return;
      }

      const embeddings = await this.generateEmbeddings(chunks);

      await this.embeddingsRepo.deleteByMaterialId(materialId);

      const chunkEntities = chunks.map((text, i) => ({
        materialId,
        chunkText: text,
        chunkIndex: i,
        embeddingVector: embeddings[i] ? JSON.stringify(embeddings[i]) : undefined,
        syllabusClass,
        syllabusSubject,
        syllabusChapter: undefined as string | undefined,
        syllabusTopic: undefined as string | undefined,
      }));

      await this.embeddingsRepo.insertChunks(chunkEntities);
      await this.contentRepo.updateStatus(materialId, MaterialStatus.READY, undefined, chunks.length);

      this.logger.log(`Material ${materialId}: ${chunks.length} chunks embedded successfully`);
    } catch (err: any) {
      this.logger.error(`Processing material ${materialId}: ${err.message}`, err.stack);
      await this.contentRepo.updateStatus(materialId, MaterialStatus.FAILED, err.message);
    }
  }

  private validateFile(file: { originalname: string; mimetype: string; size: number }): void {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException({ code: 'INVALID_FILE_TYPE', message: `File type '${ext}' not allowed. Accepted: pdf, docx, txt.` });
    }
    if (!ALLOWED_MIMES.has(file.mimetype) && file.mimetype !== 'application/octet-stream') {
      throw new BadRequestException({ code: 'INVALID_MIME_TYPE', message: `MIME type '${file.mimetype}' not allowed.` });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: `File exceeds 20 MB limit.` });
    }
  }

  private async extractText(filePath: string, ext: string): Promise<string> {
    if (ext === '.txt') {
      return fs.readFileSync(filePath, 'utf-8');
    }

    if (ext === '.pdf') {
      // pdf-parse v1 exports a single async function: (buffer) => Promise<{text, numpages, ...}>
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (ext === '.docx') {
      // Minimal DOCX extraction — reads the XML content
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf-8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      return text;
    }

    throw new Error(`Unsupported file type: ${ext}`);
  }

  private cleanText(text: string): string {
    return text
      .replace(/\f/g, '\n')                   // form feeds → newlines
      .replace(/Page\s+\d+\s*(of\s+\d+)?/gi, '') // page numbers
      .replace(/\n{3,}/g, '\n\n')             // collapse blank lines
      .replace(/[ \t]+/g, ' ')                // normalize horizontal whitespace
      .trim();
  }

  /** Split text into ~500-token chunks with ~50-token overlap */
  private chunkText(text: string): string[] {
    if (text.length <= CHUNK_TARGET_CHARS) return [text];

    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
      if (current.length + para.length > CHUNK_TARGET_CHARS && current.length > 0) {
        chunks.push(current.trim());
        const overlap = current.slice(-CHUNK_OVERLAP_CHARS);
        current = overlap + '\n\n' + para;
      } else {
        current += (current ? '\n\n' : '') + para;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks;
  }

  /** Generate embeddings for all chunks using the embedding model API */
  private async generateEmbeddings(chunks: string[]): Promise<(number[] | null)[]> {
    if (!this.embeddingApiKey) {
      this.logger.warn('Embedding API key not configured — skipping embedding generation');
      return chunks.map(() => null);
    }

    const results: (number[] | null)[] = [];
    const batchSize = 20;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      try {
        const response = await fetch(`${this.embeddingBaseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.embeddingApiKey}`,
          },
          body: JSON.stringify({ model: this.embeddingModel, input: batch }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'unknown');
          this.logger.error(`Embedding API error: HTTP ${response.status} — ${errorText}`);
          results.push(...batch.map(() => null));
          continue;
        }

        const data = await response.json();
        for (const item of data.data ?? []) {
          results.push(item.embedding ?? null);
        }
      } catch (err: any) {
        this.logger.error(`Embedding API call failed: ${err.message}`);
        results.push(...batch.map(() => null));
      }
    }

    return results;
  }
}
