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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    const lang = user?.language || 'az';

    const conditions: Prisma.Sql[] = [
      Prisma.sql`"status" = 'active'`,
      Prisma.sql`"language" = ${lang}`
    ];
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
        return {
          id: q.id,
          textAz: q.textAz,
          options: q.options,
          categoryId: q.categoryId,
          difficulty: q.difficulty,
        };
      }),
    };
  }

  async submitAnswer(userId: string, sessionId: string, questionId: number, selectedOption: string, timeSpentMs: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire row-level lock to prevent concurrent answer submissions or status modifications
      await tx.$queryRaw`SELECT 1 FROM "GameSession" WHERE "id" = ${sessionId} FOR UPDATE`;

      const session = await tx.gameSession.findUnique({ where: { id: sessionId } });
      if (!session) throw new NotFoundException('Session not found');
      if (session.userId !== userId) throw new ForbiddenException('Not your session');

      // Expiration check (30 mins)
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (session.createdAt < thirtyMinsAgo && session.status === 'active') {
        await tx.gameSession.update({ where: { id: sessionId }, data: { status: 'expired' } });
        throw new BadRequestException('Session expired');
      }

      if (session.status !== 'active') throw new BadRequestException(`Session is ${session.status}`);
      if (!session.questionIds.includes(questionId)) throw new BadRequestException('Question not in session');

      const answers: any = session.answersJson || {};
      if (answers[questionId]) throw new BadRequestException('Already answered this question');

      if (timeSpentMs < 0 || timeSpentMs > 60000) throw new BadRequestException('Invalid time');

      const question = await tx.question.findUnique({ where: { id: questionId } });
      if (!question) throw new NotFoundException('Question not found');

      // Anti-cheat: Validate that the client didn't pause/freeze their timer
      let lastQuestionAt = session.createdAt.getTime();
      let isFirstQuestion = true;
      for (const qId of Object.keys(answers)) {
        const ansObj = answers[qId];
        if (ansObj && ansObj.submittedAt && ansObj.submittedAt > lastQuestionAt) {
          lastQuestionAt = ansObj.submittedAt;
          isFirstQuestion = false;
        }
      }

      const serverElapsed = Date.now() - lastQuestionAt;
      // Allow a generous 15-second buffer for the first question to account for initialization, page transitions, and network transit time.
      // Subsequent questions get a robust 7.5-second buffer to accommodate typical networking fluctuations.
      const buffer = isFirstQuestion ? 15000 : 7500;
      let timeAnomaly = false;
      if (timeSpentMs + buffer < serverElapsed) {
        console.warn(`[Anti-Cheat] User ${userId} flagged for response time spoofing (client: ${timeSpentMs}ms, server elapsed: ${serverElapsed}ms, buffer: ${buffer}ms)`);
        timeAnomaly = true;
      }

      // Max allowed total game elapsed time check as a secondary barrier
      const elapsedMs = Date.now() - session.createdAt.getTime();
      const answeredCount = Object.keys(answers).length;
      const maxAllowedMs = (answeredCount + 1) * 15000 + 15000;
      const isTimeout = elapsedMs > maxAllowedMs;

      if (isTimeout) {
        console.warn(`[Anti-Cheat] User ${userId} exceeded total session time limit (elapsed: ${elapsedMs}ms, max allowed: ${maxAllowedMs}ms)`);
      }

      const isCorrect = !isTimeout && !timeAnomaly && question.correctOption === selectedOption && timeSpentMs <= 10000;
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
        submittedAt: Date.now(), // Server-side timestamp of the submission
      };

      await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          answersJson: answers,
          totalScore: { increment: scoreEarned },
          correctCount: { increment: isCorrect ? 1 : 0 },
          wrongCount: { increment: isCorrect ? 0 : 1 },
        },
      });

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { language: true },
      });
      const lang = user?.language || 'az';
      const explanation = lang === 'ru' && question.explanationRu ? question.explanationRu : question.explanationAz;

      return {
        isCorrect,
        correctOption: question.correctOption,
        explanation,
        scoreEarned,
      };
    });
  }

  async finishSolo(userId: string, sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Acquire row-level lock to prevent concurrent calls
      await tx.$queryRaw`SELECT 1 FROM "GameSession" WHERE "id" = ${sessionId} FOR UPDATE`;

      const session = await tx.gameSession.findUnique({ where: { id: sessionId } });
      if (!session) throw new NotFoundException('Session not found');
      if (session.userId !== userId) throw new ForbiddenException('Not your session');
      
      if (session.status === 'finished') {
        return session; // Idempotent return
      }

      // Expiration check (30 mins)
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (session.createdAt < thirtyMinsAgo) {
        await tx.gameSession.update({ where: { id: sessionId }, data: { status: 'expired' } });
        throw new BadRequestException('Session expired');
      }

      if (session.status !== 'active') throw new BadRequestException(`Session is ${session.status}`);

      const totalQuestions = session.questionIds.length;
      const coinsEarned = session.correctCount * 5 + (session.correctCount === totalQuestions ? 50 : 0);
      const xpEarned = Math.floor(session.totalScore / 10);

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
      if (currentUser?.cityId && finishedSession.totalScore > 0) {
        await tx.cityPointsLog.create({
          data: {
            cityId: currentUser.cityId,
            userId,
            amount: finishedSession.totalScore,
            source: 'solo',
          },
        });
      }

      // 4. Clan Points integration
      if (currentUser?.clanId && finishedSession.totalScore > 0) {
        const clan = await tx.clan.findUnique({
          where: { id: currentUser.clanId },
          select: { points: true },
        });
        if (clan) {
          const newPoints = clan.points + finishedSession.totalScore;
          const newLevel = Math.floor(newPoints / 10000) + 1;
          await tx.clan.update({
            where: { id: currentUser.clanId },
            data: {
              points: newPoints,
              level: newLevel,
            },
          });
        }
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
