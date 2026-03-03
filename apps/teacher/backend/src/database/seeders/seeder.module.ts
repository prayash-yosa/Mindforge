import { Module } from '@nestjs/common';
import { DevSeederService } from './dev-seeder.service';

@Module({
  providers: [DevSeederService],
})
export class SeederModule {}
