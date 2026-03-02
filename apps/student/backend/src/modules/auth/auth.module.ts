/**
 * Mindforge Backend — Auth Module
 *
 * Wires auth controller, service, repository, policy, and JWT.
 * Exports JwtModule globally so AuthGuard (APP_GUARD) can use JwtService.
 *
 * Task 1.2: JWT for token issuance.
 * Task 1.4: JWT for token verification in AuthGuard.
 */

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { AuthPolicy } from './auth.policy';

@Global() // Make JwtModule available globally for AuthGuard
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (config.get<string>('jwt.expiresIn') ?? '1h') as any,
          issuer: 'mindforge-backend',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthPolicy],
  exports: [AuthService, AuthRepository, JwtModule],
})
export class AuthModule {}
