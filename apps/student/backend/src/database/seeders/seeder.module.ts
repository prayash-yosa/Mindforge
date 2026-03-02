/**
 * Mindforge Backend — Seeder Module
 *
 * Registers development data seeders.
 * Only runs in non-production environments.
 */

import { Module } from '@nestjs/common';
import { DevSeederService } from './dev-seeder.service';

@Module({
  providers: [DevSeederService],
})
export class SeederModule {}
