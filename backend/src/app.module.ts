import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { QuestionReportsModule } from './question-reports/question-reports.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { GamesModule } from './games/games.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { DuelsModule } from './duels/duels.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // Rate limiting: 60 requests per minute per IP globally
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 60 },
      // Stricter limit for auth endpoints — override per controller if needed
      { name: 'auth', ttl: 60000, limit: 10 },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    PrismaModule,
    QuestionsModule,
    QuestionReportsModule,
    AuthModule,
    UsersModule,
    WalletModule,
    GamesModule,
    LeaderboardsModule,
    DuelsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
