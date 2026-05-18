import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async startSolo(userId: string, categoryId?: number, difficulty?: number, limit = 10) {
    if (limit > 20) limit = 20;

    const conditions: Prisma.Sql[] = [Prisma.sql`"status" = 'active'`];
    if (categoryId) conditions.push(Prisma.sql`"categoryId" = ${categoryId}`);
    if (difficulty) conditions.push(Prisma.sql`"difficulty" = ${difficulty}`);

    const whereClause = Prisma.join(conditions, ' AND ');

    const questions: any[] = await this.prisma.$queryRaw`
      SELECT id, "textAz", options, "categoryId", difficulty FROM "Question"
      WHERE ${whereClause}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    if (questions.length === 0) {
      throw new BadRequestException('No questions found for the given criteria');
    }

    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        mode: 'solo',
        categoryId,
        questionIds: questions.map((q) => q.id),
        answersJson: {},
        status: 'active',
      },
    });

    return {
      sessionId: session.id,
      questions: questions.map((q) => {
        const { correctOption, ...rest } = q;
        return rest;
      }),
    };
  }

  async submitAnswer(userId: string, sessionId: string, questionId: number, selectedOption: string, timeSpentMs: number) {
    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');

    // Expiration check (30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (session.createdAt < thirtyMinsAgo && session.status === 'active') {
      await this.prisma.gameSession.update({ where: { id: sessionId }, data: { status: 'expired' } });
      throw new BadRequestException('Session expired');
    }

    if (session.status !== 'active') throw new BadRequestException(`Session is ${session.status}`);
    if (!session.questionIds.includes(questionId)) throw new BadRequestException('Question not in session');

    const answers: any = session.answersJson || {};
    if (answers[questionId]) throw new BadRequestException('Already answered this question');

    if (timeSpentMs < 0 || timeSpentMs > 60000) throw new BadRequestException('Invalid time');

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    // Anti-cheat validation: Ensure client doesn't freeze/pause the UI to search answers
    const elapsedMs = Date.now() - session.createdAt.getTime();
    const answeredCount = Object.keys(answers).length;
    const maxAllowedMs = (answeredCount + 1) * 15000 + 15000; // 15s per question + 15s initial network/load buffer
    const isTimeout = elapsedMs > maxAllowedMs;

    if (isTimeout) {
      console.warn(`[Anti-Cheat] User ${userId} exceeded time limit for question ${questionId} in session ${sessionId} (elapsed: ${elapsedMs}ms, max allowed: ${maxAllowedMs}ms)`);
    }

    const isCorrect = !isTimeout && question.correctOption === selectedOption && timeSpentMs <= 10000;
    let scoreEarned = 0;

    if (isCorrect) {
      scoreEarned = 100;
      if (timeSpentMs <= 2000) scoreEarned += 50;
      else if (timeSpentMs <= 5000) scoreEarned += 30;
      else if (timeSpentMs <= 8000) scoreEarned += 10;
    }

    answers[questionId] = {
      choice: selectedOption,
      time: timeSpentMs,
      correct: isCorrect,
      score: scoreEarned,
    };

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        answersJson: answers,
        totalScore: { increment: scoreEarned },
        correctCount: { increment: isCorrect ? 1 : 0 },
        wrongCount: { increment: isCorrect ? 0 : 1 },
      },
    });

    return {
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanationAz,
      scoreEarned,
    };
  }

  async finishSolo(userId: string, sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');
    
    if (session.status === 'finished') {
      return session; // Idempotent return
    }

    // Expiration check (30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (session.createdAt < thirtyMinsAgo) {
      await this.prisma.gameSession.update({ where: { id: sessionId }, data: { status: 'expired' } });
      throw new BadRequestException('Session expired');
    }

    if (session.status !== 'active') throw new BadRequestException(`Session is ${session.status}`);

    const totalQuestions = session.questionIds.length;
    const coinsEarned = session.correctCount * 5 + (session.correctCount === totalQuestions ? 50 : 0);
    const xpEarned = Math.floor(session.totalScore / 10);

    return this.prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction to prevent race conditions
      const currentSession = await tx.gameSession.findUnique({ where: { id: sessionId } });
      if (currentSession?.status === 'finished') return currentSession;

      // 1. Update Session
      const finishedSession = await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          status: 'finished',
          finishedAt: new Date(),
          coinsEarned,
          xpEarned,
        },
      });

      // 2. Update User Stats & Wallet
      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const currentXp = currentUser?.xp || 0;
      const newXp = currentXp + xpEarned;
      const newLevel = Math.floor(newXp / 1000) + 1;

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
        },
      });

      await this.wallet.addCoins(userId, coinsEarned, 'solo_game_reward', { sessionId }, tx);

      // 3. City Points Log
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user?.cityId && finishedSession.totalScore > 0) {
        await tx.cityPointsLog.create({
          data: {
            cityId: user.cityId,
            userId,
            amount: finishedSession.totalScore,
            source: 'solo',
          },
        });
      }

      return finishedSession;
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId && !session.user.isAdmin) throw new ForbiddenException('Access denied');
    return session;
  }
}
