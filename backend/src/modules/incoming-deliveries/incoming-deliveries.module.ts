import { Module } from '@nestjs/common';
import { IncomingDeliveriesController } from './incoming-deliveries.controller';
import { IncomingDeliveriesService } from './incoming-deliveries.service';
import { OutgoingDeliveriesModule } from '../outgoing-deliveries/outgoing-deliveries.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [OutgoingDeliveriesModule, StorageModule],
  controllers: [IncomingDeliveriesController],
  providers: [IncomingDeliveriesService],
})
export class IncomingDeliveriesModule {}
