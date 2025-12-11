import { Module } from '@nestjs/common';
import { ReviewerModule } from '../reviewer/reviewer.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ReviewerModule],
  controllers: [HealthController],
})
export class HealthModule {}