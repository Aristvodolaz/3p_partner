import { Module } from '@nestjs/common';
import { WarehouseZonesController } from './warehouse-zones.controller';
import { WarehouseZonesService } from './warehouse-zones.service';

@Module({
  controllers: [WarehouseZonesController],
  providers: [WarehouseZonesService],
  exports: [WarehouseZonesService],
})
export class WarehouseZonesModule {}
