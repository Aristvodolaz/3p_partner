import { Module } from '@nestjs/common';
import { IncomingDeliveriesController } from './incoming-deliveries.controller';
import { IncomingDeliveriesService } from './incoming-deliveries.service';

@Module({
  controllers: [IncomingDeliveriesController],
  providers: [IncomingDeliveriesService],
})
export class IncomingDeliveriesModule {}
