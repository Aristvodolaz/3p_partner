import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PartnersModule } from './modules/partners/partners.module';
import { SkusModule } from './modules/skus/skus.module';
import { RequestsModule } from './modules/requests/requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PartnersModule,
    SkusModule,
    RequestsModule,
  ],
})
export class AppModule {}
