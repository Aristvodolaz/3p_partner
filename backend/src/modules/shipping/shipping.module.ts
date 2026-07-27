import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

@Module({
  imports: [DocumentsModule],
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}
