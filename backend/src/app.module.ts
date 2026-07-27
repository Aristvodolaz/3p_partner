import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PartnersModule } from './modules/partners/partners.module';
import { SkusModule } from './modules/skus/skus.module';
import { RequestsModule } from './modules/requests/requests.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReceivingModule } from './modules/receiving/receiving.module';
import { StorageModule } from './modules/storage/storage.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PartnersModule,
    SkusModule,
    RequestsModule,
    DocumentsModule,
    ReceivingModule,
    StorageModule,
    ShippingModule,
  ],
})
export class AppModule {}
