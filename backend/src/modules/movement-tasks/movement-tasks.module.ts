import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { WarehouseZonesModule } from '../warehouse-zones/warehouse-zones.module';
import { MovementTasksController } from './movement-tasks.controller';
import { MovementTasksService } from './movement-tasks.service';

@Module({
  imports: [StorageModule, WarehouseZonesModule],
  controllers: [MovementTasksController],
  providers: [MovementTasksService],
  exports: [MovementTasksService],
})
export class MovementTasksModule {}
