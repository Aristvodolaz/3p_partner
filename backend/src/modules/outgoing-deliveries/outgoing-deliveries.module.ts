import { Module } from '@nestjs/common';
import { OutgoingDeliveriesController } from './outgoing-deliveries.controller';
import { OutgoingDeliveriesService } from './outgoing-deliveries.service';
import { StorageModule } from '../storage/storage.module';
import { MovementTasksModule } from '../movement-tasks/movement-tasks.module';

@Module({
  imports: [StorageModule, MovementTasksModule],
  controllers: [OutgoingDeliveriesController],
  providers: [OutgoingDeliveriesService],
  exports: [OutgoingDeliveriesService],
})
export class OutgoingDeliveriesModule {}
