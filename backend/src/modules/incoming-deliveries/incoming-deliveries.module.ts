import { Module } from '@nestjs/common';
import { IncomingDeliveriesController } from './incoming-deliveries.controller';
import { IncomingDeliveriesService } from './incoming-deliveries.service';
import { OutgoingDeliveriesModule } from '../outgoing-deliveries/outgoing-deliveries.module';

@Module({
  imports: [OutgoingDeliveriesModule],
  controllers: [IncomingDeliveriesController],
  providers: [IncomingDeliveriesService],
})
export class IncomingDeliveriesModule {}
