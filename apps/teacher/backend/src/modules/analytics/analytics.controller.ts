import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis/:classId')
  async getClassKpis(@Param('classId') classId: string) {
    const data = await this.analyticsService.getClassKpis(classId);
    return { success: true, data };
  }

  @Get('scores/:classId')
  async getScoreTrends(@Param('classId') classId: string) {
    const data = await this.analyticsService.getScoreTrends(classId);
    return { success: true, data };
  }

  @Get('attendance/:classId')
  async getAttendanceTrends(
    @Param('classId') classId: string,
    @Query('weeks') weeks?: string,
  ) {
    const w = weeks ? parseInt(weeks, 10) : 8;
    const data = await this.analyticsService.getAttendanceTrends(classId, w);
    return { success: true, data };
  }
}
