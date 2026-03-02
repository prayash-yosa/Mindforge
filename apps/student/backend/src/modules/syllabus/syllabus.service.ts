/**
 * Mindforge Backend — Syllabus Service (Task 5.2)
 *
 * Business logic for syllabus hierarchy.
 * Transforms flat syllabus records into a nested tree.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';

/** Subject node in syllabus tree */
export interface SubjectNode {
  subject: string;
  chapters: ChapterNode[];
}

/** Chapter node in syllabus tree */
export interface ChapterNode {
  chapter: string;
  topics: TopicNode[];
}

/** Topic leaf node in syllabus tree */
export interface TopicNode {
  id: string;
  topic: string;
}

/** Full tree response */
export interface SyllabusTree {
  class: string;
  board: string;
  subjects: SubjectNode[];
}

@Injectable()
export class SyllabusService {
  private readonly logger = new Logger(SyllabusService.name);

  constructor(private readonly syllabusRepo: SyllabusRepository) {}

  /**
   * Build hierarchical syllabus tree from flat records.
   * Returns Class → Subject → Chapter → Topic.
   */
  async getTree(studentClass: string, board: string): Promise<SyllabusTree> {
    const records = await this.syllabusRepo.findByClassAndBoard(studentClass, board);

    const subjectMap = new Map<string, Map<string, TopicNode[]>>();

    for (const r of records) {
      if (!subjectMap.has(r.subject)) {
        subjectMap.set(r.subject, new Map());
      }
      const chapterMap = subjectMap.get(r.subject)!;
      if (!chapterMap.has(r.chapter)) {
        chapterMap.set(r.chapter, []);
      }
      chapterMap.get(r.chapter)!.push({ id: r.id, topic: r.topic });
    }

    const subjects: SubjectNode[] = [];
    for (const [subject, chapterMap] of subjectMap) {
      const chapters: ChapterNode[] = [];
      for (const [chapter, topics] of chapterMap) {
        chapters.push({ chapter, topics });
      }
      subjects.push({ subject, chapters });
    }

    return { class: studentClass, board, subjects };
  }
}
