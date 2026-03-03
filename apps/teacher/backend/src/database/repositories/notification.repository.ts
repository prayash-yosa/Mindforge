import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { NotificationEventEntity } from '../entities/notification-event.entity';

@Injectable()
export class NotificationRepository extends BaseRepository {
  constructor(
    @InjectRepository(NotificationEventEntity)
    private readonly repo: Repository<NotificationEventEntity>,
  ) {
    super('NotificationRepository');
  }

  async create(data: Partial<NotificationEventEntity>): Promise<NotificationEventEntity> {
    return this.withErrorHandling(
      () => this.repo.save(this.repo.create(data)),
      'create',
    );
  }

  async bulkCreate(events: Partial<NotificationEventEntity>[]): Promise<NotificationEventEntity[]> {
    return this.withErrorHandling(
      () => this.repo.save(events.map((e) => this.repo.create(e))),
      'bulkCreate',
    );
  }

  async findByRecipient(
    recipientRole: string,
    recipientId?: string,
    unreadOnly = false,
  ): Promise<NotificationEventEntity[]> {
    return this.withErrorHandling(async () => {
      const where: any = { recipientRole };
      if (recipientId) where.recipientId = recipientId;
      if (unreadOnly) where.isRead = false;
      return this.repo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
    }, 'findByRecipient');
  }

  async markAsRead(id: string): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.repo.update(id, { isRead: true });
    }, 'markAsRead');
  }

  async markAllAsRead(recipientRole: string, recipientId: string): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.repo.update(
        { recipientRole, recipientId, isRead: false },
        { isRead: true },
      );
    }, 'markAllAsRead');
  }

  async countUnread(recipientRole: string, recipientId: string): Promise<number> {
    return this.withErrorHandling(
      () => this.repo.count({
        where: { recipientRole, recipientId, isRead: false },
      }),
      'countUnread',
    );
  }
}
