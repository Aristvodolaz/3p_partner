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
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PackingModule } from './modules/packing/packing.module';
import { ActsModule } from './modules/acts/acts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    PartnersModule,
    SkusModule,
    RequestsModule,
    DocumentsModule,
    ReceivingModule,
    StorageModule,
    ShippingModule,
    PackingModule,
    ActsModule,
  ],
})
export class AppModule {}
