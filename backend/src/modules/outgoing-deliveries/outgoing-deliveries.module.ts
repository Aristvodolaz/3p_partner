import { Module } from '@nestjs/common';
import { OutgoingDeliveriesController } from './outgoing-deliveries.controller';
import { OutgoingDeliveriesService } from './outgoing-deliveries.service';

@Module({
  controllers: [OutgoingDeliveriesController],
  providers: [OutgoingDeliveriesService],
  exports: [OutgoingDeliveriesService],
})
export class OutgoingDeliveriesModule {}
