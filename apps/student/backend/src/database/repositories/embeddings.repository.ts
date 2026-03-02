/**
 * Mindforge Backend — Embeddings Repository (Task 8.3)
 *
 * CRUD for teacher_material_chunks. Vector similarity search scoped by class/subject.
 *
 * In dev/SQLite mode, cosine similarity is computed in application code.
 * In production/PostgreSQL with pgvector, this would use SQL-level similarity operators.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { TeacherMaterialChunkEntity } from '../entities/teacher-material-chunk.entity';

export interface ChunkWithScore {
  chunk: TeacherMaterialChunkEntity;
  score: number;
}

@Injectable()
export class EmbeddingsRepository extends BaseRepository {
  constructor(
    @InjectRepository(TeacherMaterialChunkEntity)
    private readonly repo: Repository<TeacherMaterialChunkEntity>,
  ) {
    super('EmbeddingsRepository');
  }

  async insertChunk(data: Partial<TeacherMaterialChunkEntity>): Promise<TeacherMaterialChunkEntity> {
    return this.withErrorHandling(
      () => this.repo.save(this.repo.create(data)),
      'insertChunk',
    );
  }

  async insertChunks(chunks: Partial<TeacherMaterialChunkEntity>[]): Promise<void> {
    await this.withErrorHandling(
      () => this.repo.save(chunks.map((c) => this.repo.create(c))),
      'insertChunks',
    );
  }

  async findByMaterialId(materialId: string): Promise<TeacherMaterialChunkEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({ where: { materialId }, order: { chunkIndex: 'ASC' } }),
      'findByMaterialId',
    );
  }

  async findChunksByIds(ids: string[]): Promise<TeacherMaterialChunkEntity[]> {
    if (!ids.length) return [];
    return this.withErrorHandling(
      () => this.repo.createQueryBuilder('c')
        .where('c.id IN (:...ids)', { ids })
        .getMany(),
      'findChunksByIds',
    );
  }

  /**
   * Vector similarity search. Retrieves all chunks matching class/subject scope,
   * then computes cosine similarity in-memory (for SQLite dev mode).
   *
   * For production PostgreSQL + pgvector, replace with SQL-level similarity.
   */
  async searchSimilar(
    queryEmbedding: number[],
    syllabusClass: string,
    syllabusSubject?: string,
    topK = 5,
  ): Promise<ChunkWithScore[]> {
    const qb = this.repo.createQueryBuilder('c')
      .where('c.syllabus_class = :syllabusClass', { syllabusClass })
      .andWhere('c.embedding_vector IS NOT NULL');

    if (syllabusSubject) {
      qb.andWhere('c.syllabus_subject = :syllabusSubject', { syllabusSubject });
    }

    const candidates = await this.withErrorHandling(
      () => qb.getMany(),
      'searchSimilar',
    );

    const scored: ChunkWithScore[] = [];
    for (const chunk of candidates) {
      const embedding = this.parseEmbedding(chunk.embeddingVector);
      if (!embedding) continue;
      const score = cosineSimilarity(queryEmbedding, embedding);
      scored.push({ chunk, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async deleteByMaterialId(materialId: string): Promise<void> {
    await this.withErrorHandling(
      () => this.repo.delete({ materialId }),
      'deleteByMaterialId',
    );
  }

  private parseEmbedding(raw: string | null): number[] | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
