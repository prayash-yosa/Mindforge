import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { TeacherRepository } from '../../database/repositories/teacher.repository';

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly teacherRepo: TeacherRepository,
  ) {}

  @Public()
  @Post('teacher/login')
  async login(@Body() dto: LoginDto) {
    if (!dto.email) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Email is required.' });
    }

    const teacher = await this.teacherRepo.findByEmail(dto.email);
    if (!teacher || !teacher.isActive) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const token = await this.signToken(teacher.id, teacher.displayName, 'TEACHER');

    return {
      success: true,
      data: {
        token,
        teacherName: teacher.displayName,
        teacherId: teacher.id,
      },
    };
  }

  @Public()
  @Post('demo-login')
  async demoLogin() {
    const isProduction = this.configService.get<boolean>('isProduction');
    if (isProduction) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Demo login is disabled in production.' });
    }

    const teacher = await this.teacherRepo.findByExternalId('T001');
    if (!teacher) {
      throw new UnauthorizedException({
        code: 'NO_SEED_DATA',
        message: 'No demo teacher found. Ensure dev seeder has run.',
      });
    }

    const token = await this.signToken(teacher.id, teacher.displayName, 'TEACHER');

    this.logger.log(`Demo login issued for teacher ${teacher.displayName} (${teacher.id})`);

    return {
      success: true,
      data: {
        token,
        teacherName: teacher.displayName,
        teacherId: teacher.id,
      },
    };
  }

  private async signToken(sub: string, name: string, role: string): Promise<string> {
    return this.jwtService.signAsync({ sub, name, role });
  }
}
