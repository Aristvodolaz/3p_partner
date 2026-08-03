import { Module } from '@nestjs/common';
import { ActsController } from './acts.controller';
import { ActsService } from './acts.service';

@Module({
  controllers: [ActsController],
  providers: [ActsService],
})
export class ActsModule {}
