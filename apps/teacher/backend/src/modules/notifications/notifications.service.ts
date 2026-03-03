import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../../database/repositories/notification.repository';
import { TestRepository } from '../../database/repositories/test.repository';
import { EntityNotFoundException } from '../../common/exceptions/domain.exceptions';
import { NotificationEventEntity } from '../../database/entities/notification-event.entity';

export interface NotificationListItem {
  id: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  isRead: boolean;
  payload: Record<string, any> | null;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly testRepo: TestRepository,
  ) {}

  async getTeacherNotifications(
    teacherId: string,
    unreadOnly: boolean = false,
  ): Promise<NotificationListItem[]> {
    const notifications = await this.notificationRepo.findByRecipient(
      'teacher',
      teacherId,
      unreadOnly,
    );

    const general = await this.notificationRepo.findByRecipient(
      'teacher',
      undefined,
      unreadOnly,
    );

    const all = [...notifications, ...general]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    return all.map((n) => this.toListItem(n));
  }

  async getUnreadCount(teacherId: string): Promise<number> {
    const personal = await this.notificationRepo.countUnread('teacher', teacherId);
    return personal;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepo.markAsRead(notificationId);
  }

  async markAllAsRead(teacherId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead('teacher', teacherId);
  }

  async generateTestAlerts(testDefinitionId: string): Promise<number> {
    const test = await this.testRepo.findDefinitionById(testDefinitionId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testDefinitionId);

    let alertCount = 0;

    if (test.status === 'published') {
      const attempts = await this.testRepo.findAttemptsByTest(testDefinitionId);
      const submittedStudents = new Set(
        attempts.filter((a) => a.status !== 'in_progress').map((a) => a.studentId),
      );
      const inProgress = attempts.filter((a) => a.status === 'in_progress');

      if (inProgress.length > 0) {
        await this.notificationRepo.create({
          category: 'evaluation_pending',
          priority: 'medium',
          title: `${inProgress.length} student(s) still in progress`,
          body: `Test "${test.title}" has ${inProgress.length} in-progress attempts.`,
          recipientRole: 'teacher',
          recipientId: test.createdBy,
          payload: JSON.stringify({ testDefinitionId, inProgressCount: inProgress.length }),
        });
        alertCount++;
      }

      const hasUnevaluated = attempts.some(
        (a) => a.status === 'submitted' || a.status === 'auto_submitted',
      );
      if (hasUnevaluated) {
        await this.notificationRepo.create({
          category: 'evaluation_pending',
          priority: 'high',
          title: 'Evaluation Pending',
          body: `Test "${test.title}" has submissions awaiting evaluation.`,
          recipientRole: 'teacher',
          recipientId: test.createdBy,
          payload: JSON.stringify({ testDefinitionId }),
        });
        alertCount++;
      }
    }

    this.logger.log(`Generated ${alertCount} test alerts for ${testDefinitionId}`);
    return alertCount;
  }

  private toListItem(n: NotificationEventEntity): NotificationListItem {
    let payload: Record<string, any> | null = null;
    if (n.payload) {
      try {
        payload = JSON.parse(n.payload);
      } catch { /* ignore parse error */ }
    }

    return {
      id: n.id,
      category: n.category,
      priority: n.priority,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      payload,
      createdAt: n.createdAt,
    };
  }
}
