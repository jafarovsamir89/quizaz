import { Module } from '@nestjs/common';
import { DuelsService } from './duels.service';
import { DuelsController } from './duels.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { DuelsGateway } from './duels.gateway';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [DuelsController],
  providers: [DuelsService, DuelsGateway],
  exports: [DuelsService], // needed for SchedulerModule
})
export class DuelsModule {}
