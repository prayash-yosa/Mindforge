import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { AttendanceController } from './attendance.controller';
import { ClassService } from './class.service';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [ClassController, AttendanceController],
  providers: [ClassService, AttendanceService],
  exports: [ClassService, AttendanceService],
})
export class ClassAttendanceModule {}
