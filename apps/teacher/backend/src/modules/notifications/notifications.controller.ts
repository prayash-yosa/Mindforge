import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Teacher, AuthenticatedTeacher } from '../../common/decorators/teacher.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Teacher() teacher: AuthenticatedTeacher,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const data = await this.notificationsService.getTeacherNotifications(
      teacher.teacherId,
      unreadOnly === 'true',
    );
    return { success: true, data };
  }

  @Get('unread-count')
  async getUnreadCount(@Teacher() teacher: AuthenticatedTeacher) {
    const count = await this.notificationsService.getUnreadCount(teacher.teacherId);
    return { success: true, data: { count } };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id);
    return { success: true, message: 'Marked as read' };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Teacher() teacher: AuthenticatedTeacher) {
    await this.notificationsService.markAllAsRead(teacher.teacherId);
    return { success: true, message: 'All marked as read' };
  }

  @Post('alerts/test/:testId')
  @HttpCode(HttpStatus.OK)
  async generateTestAlerts(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('testId') testId: string,
  ) {
    const count = await this.notificationsService.generateTestAlerts(testId);
    return { success: true, data: { alertsCreated: count } };
  }
}
