import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';
import { SyllabusDocumentEntity } from '../../database/entities/syllabus-document.entity';
import { AiAuditService } from '../../shared/ai-governance/ai-audit.service';
import { AiRateLimiterService } from '../../shared/ai-governance/ai-rate-limiter.service';
import { InvalidOperationException } from '../../common/exceptions/domain.exceptions';
import * as fs from 'fs';

@Injectable()
export class AiIngestionService {
  private readonly logger = new Logger(AiIngestionService.name);
  private readonly aiBaseUrl: string;
  private readonly aiApiKey: string;
  private readonly aiModel: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly syllabusRepo: SyllabusRepository,
    private readonly configService: ConfigService,
    private readonly aiAudit: AiAuditService,
    private readonly aiRateLimiter: AiRateLimiterService,
  ) {
    this.aiBaseUrl = this.configService.get<string>('ai.baseUrl') ?? 'https://api.openai.com/v1';
    this.aiApiKey = this.configService.get<string>('ai.apiKey') ?? '';
    this.aiModel = this.configService.get<string>('ai.model') ?? 'gpt-4o-mini';
    this.timeoutMs = this.configService.get<number>('ai.timeoutMs') ?? 15000;
  }

  async processPendingDocuments(): Promise<{ processed: number; failed: number }> {
    const pending = await this.syllabusRepo.findPendingDocuments();
    this.logger.log(`Found ${pending.length} pending documents for processing`);

    let processed = 0;
    let failed = 0;

    for (const doc of pending) {
      try {
        await this.processDocument(doc);
        processed++;
      } catch (err: any) {
        this.logger.error(`Failed to process document ${doc.id}: ${err.message}`);
        await this.syllabusRepo.updateDocumentStatus(doc.id, 'failed', err.message);
        failed++;
      }
    }

    return { processed, failed };
  }

  async processSingleDocument(docId: string): Promise<void> {
    const doc = await this.syllabusRepo.findDocumentById(docId);
    if (!doc) throw new Error(`Document ${docId} not found`);
    await this.processDocument(doc);
  }

  async processDocument(doc: SyllabusDocumentEntity): Promise<void> {
    this.logger.log(`Processing document ${doc.id} (${doc.fileName})`);
    await this.syllabusRepo.updateDocumentStatus(doc.id, 'processing');

    const rawText = await this.extractText(doc);
    if (!rawText || rawText.trim().length < 10) {
      await this.syllabusRepo.updateDocumentStatus(doc.id, 'failed', 'No readable text extracted');
      return;
    }

    const rateLimitId = doc.uploadedBy || doc.classId || 'system';
    const rateCheck = this.aiRateLimiter.checkLimit(rateLimitId);
    if (!rateCheck.allowed) {
      throw new InvalidOperationException(
        `AI rate limit exceeded: ${rateCheck.reason}`,
      );
    }

    const analysis = await this.analyzeWithAi(rawText, doc.subject, {
      teacherId: doc.uploadedBy || 'system',
      classId: doc.classId,
    });

    await this.syllabusRepo.createLesson({
      syllabusDocumentId: doc.id,
      classId: doc.classId,
      subject: doc.subject,
      conceptSummary: analysis.conceptSummary,
      learningObjectives: JSON.stringify(analysis.learningObjectives),
      hasNumericals: analysis.hasNumericals,
      chapters: analysis.chapters ? JSON.stringify(analysis.chapters) : undefined,
      topics: analysis.topics ? JSON.stringify(analysis.topics) : undefined,
      rawText: rawText.substring(0, 10000),
    });

    await this.syllabusRepo.updateDocumentStatus(doc.id, 'ready');
    this.logger.log(`Document ${doc.id} processed successfully`);
  }

  private async extractText(doc: SyllabusDocumentEntity): Promise<string> {
    if (!fs.existsSync(doc.storagePath)) {
      throw new Error(`File not found at ${doc.storagePath}`);
    }

    if (doc.fileType === 'application/pdf') {
      return this.extractPdfText(doc.storagePath);
    }

    if (doc.fileType === 'text/plain') {
      return fs.readFileSync(doc.storagePath, 'utf-8');
    }

    if (doc.fileType.startsWith('image/')) {
      return `[Image file: ${doc.fileName}. OCR extraction would be performed here in production.]`;
    }

    return fs.readFileSync(doc.storagePath, 'utf-8');
  }

  private async extractPdfText(filePath: string): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err: any) {
      this.logger.warn(`pdf-parse failed: ${err.message}. Using fallback.`);
      return `[PDF content from file. Install pdf-parse for text extraction.]`;
    }
  }

  private async analyzeWithAi(
    rawText: string,
    subject: string,
    auditContext: { teacherId: string; classId?: string },
  ): Promise<{
    conceptSummary: string;
    learningObjectives: string[];
    hasNumericals: boolean;
    chapters?: string[];
    topics?: string[];
  }> {
    if (!this.aiApiKey) {
      this.logger.warn('No AI API key configured — using fallback extraction');
      return this.fallbackAnalysis(rawText, subject);
    }

    const startMs = Date.now();
    try {
      const systemPrompt = `You are an educational content analyst. Analyze the following syllabus/lesson content for the subject "${subject}" and return a JSON object with:
- "conceptSummary": A clear, concise summary of the key concepts (2-4 sentences)
- "learningObjectives": An array of 3-7 specific learning objectives
- "hasNumericals": boolean — true if the content contains mathematical calculations, numerical problems, or value-solving exercises
- "chapters": An array of chapter/section names found
- "topics": An array of specific topics covered

Return ONLY valid JSON, no markdown.`;

      const truncated = rawText.substring(0, 6000);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.aiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.aiApiKey}`,
        },
        body: JSON.stringify({
          model: this.aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: truncated },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        const latencyMs = Date.now() - startMs;
        this.aiAudit.record({
          operation: 'syllabus_ingestion',
          model: this.aiModel,
          teacherId: auditContext.teacherId,
          classId: auditContext.classId,
          inputTokenEstimate: Math.ceil(truncated.length / 4),
          outputTokenEstimate: 0,
          latencyMs,
          success: false,
          errorCode: `HTTP_${response.status}`,
        });
        throw new Error(`AI API returned ${response.status}: ${errText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content ?? '';
      const usage = data.usage;
      const inputTokens = usage?.prompt_tokens ?? Math.ceil(truncated.length / 4);
      const outputTokens = usage?.completion_tokens ?? Math.ceil(content.length / 4);
      const latencyMs = Date.now() - startMs;

      this.aiAudit.record({
        operation: 'syllabus_ingestion',
        model: this.aiModel,
        teacherId: auditContext.teacherId,
        classId: auditContext.classId,
        inputTokenEstimate: inputTokens,
        outputTokenEstimate: outputTokens,
        latencyMs,
        success: true,
      });

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        conceptSummary: parsed.conceptSummary ?? 'No summary available',
        learningObjectives: Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives : [],
        hasNumericals: !!parsed.hasNumericals,
        chapters: Array.isArray(parsed.chapters) ? parsed.chapters : undefined,
        topics: Array.isArray(parsed.topics) ? parsed.topics : undefined,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startMs;
      const isHttpError = err.message?.includes('AI API returned');
      if (!isHttpError) {
        this.aiAudit.record({
          operation: 'syllabus_ingestion',
          model: this.aiModel,
          teacherId: auditContext.teacherId,
          classId: auditContext.classId,
          inputTokenEstimate: Math.ceil((rawText.substring(0, 6000)).length / 4),
          outputTokenEstimate: 0,
          latencyMs,
          success: false,
          errorCode: err.name || 'UNKNOWN',
        });
      }
      this.logger.error(`AI analysis failed: ${err.message}. Using fallback.`);
      return this.fallbackAnalysis(rawText, subject);
    }
  }

  private fallbackAnalysis(rawText: string, subject: string) {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const hasNumbers = /\d+\s*[\+\-\×\÷\=\/\*]|calculate|solve|find the value/i.test(rawText);

    return {
      conceptSummary: `Content for ${subject} extracted from uploaded material. Contains ${lines.length} content lines.`,
      learningObjectives: [
        `Understand key concepts in ${subject}`,
        `Apply knowledge from the provided material`,
        `Review and practice the covered topics`,
      ],
      hasNumericals: hasNumbers,
      chapters: undefined,
      topics: undefined,
    };
  }
}
