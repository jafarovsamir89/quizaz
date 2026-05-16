import { Module } from '@nestjs/common';
import { DuelsService } from './duels.service';
import { DuelsController } from './duels.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [DuelsController],
  providers: [DuelsService],
  exports: [DuelsService], // needed for SchedulerModule
})
export class DuelsModule {}
