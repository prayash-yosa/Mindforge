import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';
import { ClassRepository } from '../../database/repositories/class.repository';
import { EntityNotFoundException } from '../../common/exceptions/domain.exceptions';
import { SyllabusDocumentEntity } from '../../database/entities/syllabus-document.entity';
import { UploadSyllabusDto } from './dto/upload-syllabus.dto';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt']);

@Injectable()
export class SyllabusUploadService {
  private readonly logger = new Logger(SyllabusUploadService.name);
  private readonly storagePath: string;
  private readonly maxFileSizeMb: number;

  constructor(
    private readonly syllabusRepo: SyllabusRepository,
    private readonly classRepo: ClassRepository,
    private readonly configService: ConfigService,
  ) {
    this.storagePath = this.configService.get<string>('storage.syllabusPath') ?? './uploads/syllabus';
    this.maxFileSizeMb = this.configService.get<number>('storage.maxFileSizeMb') ?? 20;
  }

  async upload(
    teacherId: string,
    dto: UploadSyllabusDto,
    file: Express.Multer.File,
  ): Promise<SyllabusDocumentEntity> {
    const cls = await this.classRepo.findClassById(dto.classId);
    if (!cls) throw new EntityNotFoundException('Class', dto.classId);

    this.validateFile(file);

    const storedPath = await this.storeFile(file, dto.classId);

    const doc = await this.syllabusRepo.createDocument({
      classId: dto.classId,
      subject: dto.subject,
      fileName: file.originalname,
      fileType: file.mimetype,
      storagePath: storedPath,
      fileSizeBytes: file.size,
      status: 'pending',
      uploadedBy: teacherId,
      classDate: dto.classDate,
      durationMinutes: dto.durationMinutes ?? 60,
    });

    this.logger.log(`Syllabus uploaded: ${doc.id} (${file.originalname}, ${file.size} bytes) for class ${dto.classId}`);
    return doc;
  }

  async retryProcessing(docId: string): Promise<SyllabusDocumentEntity> {
    const doc = await this.syllabusRepo.findDocumentById(docId);
    if (!doc) throw new EntityNotFoundException('SyllabusDocument', docId);

    if (doc.status !== 'failed') {
      throw new BadRequestException({
        code: 'INVALID_OPERATION',
        message: 'Only failed documents can be retried',
      });
    }

    await this.syllabusRepo.updateDocumentStatus(docId, 'pending');
    this.logger.log(`Retrying processing for document ${docId}`);
    return { ...doc, status: 'pending', errorMessage: '' } as SyllabusDocumentEntity;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'No file uploaded' });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: `File type '${ext}' not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
      });
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException({
        code: 'INVALID_MIME_TYPE',
        message: `MIME type '${file.mimetype}' not allowed`,
      });
    }

    const maxBytes = this.maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: `File exceeds ${this.maxFileSizeMb}MB limit`,
      });
    }
  }

  private async storeFile(file: Express.Multer.File, classId: string): Promise<string> {
    const dir = path.join(this.storagePath, classId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = `${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(dir, safeName);

    fs.writeFileSync(filePath, file.buffer);
    return filePath;
  }
}
