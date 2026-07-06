import { Module } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { SkusController } from './skus.controller';
import { TariffsController } from './tariffs.controller';
import { SkusService, UPLOADS_DIR } from './skus.service';

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Module({
  controllers: [SkusController, TariffsController],
  providers: [SkusService],
})
export class SkusModule {}
