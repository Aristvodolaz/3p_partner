import { Module } from '@nestjs/common';
import { WarehouseZonesModule } from '../warehouse-zones/warehouse-zones.module';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [WarehouseZonesModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
