import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class DuelsService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async findOrCreate(userId: string) {
    // 1. Return existing active duel for this user if they haven't finished their turns (resume support)
    const activeDuels = await this.prisma.duel.findMany({
      where: {
        OR: [{ initiatorId: userId }, { opponentId: userId }],
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    const unfinishedActiveDuel = activeDuels.find((duel) => {
      const isInitiator = duel.initiatorId === userId;
      const answers: any = isInitiator ? (duel.initiatorAnswers || {}) : (duel.opponentAnswers || {});
      const answeredCount = Object.keys(answers).length;
      return answeredCount < duel.questionIds.length;
    });

    if (unfinishedActiveDuel) {
      return this.getDuelWithQuestions(unfinishedActiveDuel, userId);
    }

    // 2. Join a pending duel from someone else
    const pendingDuel = await this.prisma.duel.findFirst({
      where: {
        status: 'pending',
        initiatorId: { not: userId },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingDuel) {
      // Spend entry fee for opponent
      const entryFee = pendingDuel.entryFeeCoins || 10;
      await this.wallet.spendCoins(userId, entryFee, 'duel_entry_fee', { duelId: pendingDuel.id });

      const updatedDuel = await this.prisma.duel.update({
        where: { id: pendingDuel.id },
        data: {
          opponentId: userId,
          status: 'active',
          startedAt: new Date(),
        },
      });
      return this.getDuelWithQuestions(updatedDuel, userId);
    }

    // 3. Resume own pending duel if exists (only if initiator has not finished answering)
    const existingPending = await this.prisma.duel.findFirst({
      where: { initiatorId: userId, status: 'pending', expiresAt: { gt: new Date() } },
    });
    if (existingPending) {
      const answers: any = existingPending.initiatorAnswers || {};
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < existingPending.questionIds.length) {
        return this.getDuelWithQuestions(existingPending, userId);
      }
    }

    // 4. Create new pending duel
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    const lang = user?.language || 'az';

    const questions: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id FROM "Question" WHERE status = 'active' AND language = '${lang}' ORDER BY RANDOM() LIMIT 7
    `);

    if (questions.length < 7) throw new BadRequestException('Not enough questions for a duel');

    const entryFee = 10;
    // Check and spend entry fee for initiator
    await this.wallet.spendCoins(userId, entryFee, 'duel_entry_fee', { questionIds: questions.map(q => q.id) });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newDuel = await this.prisma.duel.create({
      data: {
        initiatorId: userId,
        questionIds: questions.map((q) => q.id),
        status: 'pending',
        expiresAt,
        entryFeeCoins: entryFee,
        initiatorAnswers: {},
        opponentAnswers: {},
      },
    });

    return this.getDuelWithQuestions(newDuel, userId);
  }

  private async getDuelWithQuestions(duel: any, userId: string) {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: duel.questionIds } },
      select: {
        id: true,
        textAz: true,
        options: true,
        categoryId: true,
        difficulty: true,
      },
    });

    const mappedQuestions = duel.questionIds.map((id: number) => {
      const q = questions.find((q) => q.id === id);
      if (!q) return null;
      return {
        id: q.id,
        textAz: q.textAz,
        options: q.options,
        categoryId: q.categoryId,
        difficulty: q.difficulty,
      };
    }).filter(Boolean);

    return {
      duelId: duel.id,
      status: duel.status,
      role: duel.initiatorId === userId ? 'initiator' : 'opponent',
      questions: mappedQuestions,
      expiresAt: duel.expiresAt,
    };
  }

  async submitAnswer(
    userId: string,
    duelId: string,
    questionId: number,
    selectedOption: string,
    timeSpentMs: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire row-level lock to prevent concurrent answers or state updates
      await tx.$queryRaw`SELECT 1 FROM "Duel" WHERE "id" = ${duelId} FOR UPDATE`;

      const duel = await tx.duel.findUnique({ where: { id: duelId } });
      if (!duel) throw new NotFoundException('Duel not found');

      const isInitiator = duel.initiatorId === userId;
      const isOpponent = duel.opponentId === userId;
      if (!isInitiator && !isOpponent) throw new ForbiddenException('Access denied');

      if (duel.status !== 'active' && duel.status !== 'pending')
        throw new BadRequestException('Duel is not playable');

      if (new Date() > duel.expiresAt) {
        await tx.duel.update({ where: { id: duelId }, data: { status: 'expired' } });
        throw new BadRequestException('Duel expired');
      }

      const answers: any = isInitiator ? (duel.initiatorAnswers || {}) : (duel.opponentAnswers || {});
      if (answers[questionId]) throw new BadRequestException('Already answered');

      if (!duel.questionIds.includes(questionId)) {
        throw new BadRequestException('Question not in this duel');
      }

      const question = await tx.question.findUnique({ where: { id: questionId } });
      if (!question) throw new BadRequestException('Question not found');

      // Server-side timer validation for Duel
      let lastQuestionAt = (duel.startedAt || duel.createdAt).getTime();
      for (const qId of Object.keys(answers)) {
        const ansObj = answers[qId];
        if (ansObj && ansObj.submittedAt && ansObj.submittedAt > lastQuestionAt) {
          lastQuestionAt = ansObj.submittedAt;
        }
      }

      const serverElapsed = Date.now() - lastQuestionAt;
      // Allow 4.5 seconds buffer for client loading, rendering and networking delay
      if (timeSpentMs + 4500 < serverElapsed) {
        console.warn(`[Anti-Cheat] User ${userId} flagged for response time spoofing in duel ${duelId} (client: ${timeSpentMs}ms, server elapsed: ${serverElapsed}ms)`);
        throw new BadRequestException('Response time anomaly detected');
      }

      const isCorrect = question.correctOption === selectedOption && timeSpentMs <= 10000;

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
        submittedAt: Date.now() // Record server-side submission timestamp
      };

      const updateData: any = {};
      if (isInitiator) {
        updateData.initiatorAnswers = answers;
        updateData.initiatorScore = { increment: scoreEarned };
      } else {
        updateData.opponentAnswers = answers;
        updateData.opponentScore = { increment: scoreEarned };
      }

      await tx.duel.update({ where: { id: duelId }, data: updateData });

      return {
        isCorrect,
        correctOption: question.correctOption,
        explanation: question.explanationAz,
        scoreEarned,
      };
    });
  }

  async finishSide(userId: string, duelId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire row lock
      await tx.$queryRaw`SELECT 1 FROM "Duel" WHERE "id" = ${duelId} FOR UPDATE`;

      const duel = await tx.duel.findUnique({
        where: { id: duelId },
        include: { initiator: true, opponent: true },
      });
      if (!duel) throw new NotFoundException('Duel not found');

      const isInitiator = duel.initiatorId === userId;
      const isOpponent = duel.opponentId === userId;
      if (!isInitiator && !isOpponent) throw new ForbiddenException('Access denied');

      if (duel.status === 'finished') return this.getDuelResult(duel);

      const initiatorDone = Object.keys(duel.initiatorAnswers || {}).length === duel.questionIds.length;
      const opponentDone =
        duel.opponentId && Object.keys(duel.opponentAnswers || {}).length === duel.questionIds.length;

      if (initiatorDone && opponentDone) {
        return this.finalizeDuelWithTx(duel.id, tx);
      }

      return { status: duel.status, message: 'Waiting for the other player' };
    });
  }

  private async finalizeDuel(duelId: string) {
    return this.prisma.$transaction(async (tx) => {
      return this.finalizeDuelWithTx(duelId, tx);
    });
  }

  private async finalizeDuelWithTx(duelId: string, tx: any) {
    // Acquire lock inside transaction
    await tx.$queryRaw`SELECT 1 FROM "Duel" WHERE "id" = ${duelId} FOR UPDATE`;

    const duel = await tx.duel.findUnique({
      where: { id: duelId },
      include: { initiator: true, opponent: true },
    });

    if (!duel) throw new NotFoundException('Duel not found');
    // Idempotency: already finished
    if (duel.status === 'finished') return this.getDuelResult(duel);

    let winnerId: string | null = null;
    if (duel.initiatorScore > duel.opponentScore) winnerId = duel.initiatorId;
    else if (duel.opponentScore > duel.initiatorScore) winnerId = duel.opponentId;

    const coinsWinner = 20;
    const coinsLoser = 5;
    const coinsDraw = 10;
    const prizeCoins = winnerId ? coinsWinner : coinsDraw;

    // Atomic status guard — WHERE prevents double-finalization
    let finishedDuel;
    try {
      finishedDuel = await tx.duel.update({
        where: { id: duel.id, status: { not: 'finished' } },
        data: { status: 'finished', finishedAt: new Date(), winnerId, prizeCoins },
      });
    } catch (err: any) {
      if (err.code === 'P2025') {
        // Already finalized by another thread
        const reFetched = await tx.duel.findUnique({ where: { id: duelId } });
        return this.getDuelResult(reFetched);
      }
      throw err;
    }

    // Rewards
    if (winnerId && duel.opponentId) {
      const loserId = winnerId === duel.initiatorId ? duel.opponentId : duel.initiatorId;
      await this.wallet.addCoins(winnerId, coinsWinner, 'duel_win', { duelId: duel.id }, tx);
      await this.wallet.addCoins(loserId, coinsLoser, 'duel_loss', { duelId: duel.id }, tx);
    } else if (duel.opponentId) {
      await this.wallet.addCoins(duel.initiatorId, coinsDraw, 'duel_draw', { duelId: duel.id }, tx);
      await this.wallet.addCoins(duel.opponentId, coinsDraw, 'duel_draw', { duelId: duel.id }, tx);
    }

    // City Points
    if (duel.initiator?.cityId) {
      await tx.cityPointsLog.create({
        data: {
          cityId: duel.initiator.cityId,
          userId: duel.initiatorId,
          amount: duel.initiatorScore,
          source: 'duel',
        },
      });
    }
    if (duel.opponent?.cityId) {
      await tx.cityPointsLog.create({
        data: {
          cityId: duel.opponent.cityId,
          userId: duel.opponentId!,
          amount: duel.opponentScore,
          source: 'duel',
        },
      });
    }

    return this.getDuelResult(finishedDuel);
  }

  private getDuelResult(duel: any) {
    return {
      id: duel.id,
      status: duel.status,
      initiatorScore: duel.initiatorScore,
      opponentScore: duel.opponentScore,
      winnerId: duel.winnerId,
      finishedAt: duel.finishedAt,
      prizeCoins: duel.prizeCoins,
    };
  }

  async getMyDuels(userId: string) {
    return this.prisma.duel.findMany({
      where: {
        OR: [{ initiatorId: userId }, { opponentId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: { initiator: true, opponent: true },
    });
  }

  async getDuel(duelId: string) {
    return this.prisma.duel.findUnique({
      where: { id: duelId },
      include: { initiator: true, opponent: true },
    });
  }

  async cancelDuel(userId: string, duelId: string) {
    const duel = await this.prisma.duel.findUnique({ where: { id: duelId } });
    if (!duel) throw new NotFoundException('Duel not found');
    if (duel.initiatorId !== userId) throw new ForbiddenException('Only initiator can cancel');
    if (duel.status !== 'pending') throw new BadRequestException('Cannot cancel active/finished duel');

    return this.prisma.$transaction(async (tx) => {
      // Refund initiator
      if (duel.entryFeeCoins > 0) {
        await this.wallet.addCoins(userId, duel.entryFeeCoins, 'duel_refund', { duelId }, tx);
      }

      return tx.duel.update({
        where: { id: duelId },
        data: { status: 'cancelled' },
      });
    });
  }

  /** Called by cron job to expire and auto-finalize stale duels */
  async expireStale() {
    const now = new Date();

    // Expire pending duels
    await this.prisma.duel.updateMany({
      where: { status: 'pending', expiresAt: { lt: now } },
      data: { status: 'expired' },
    });

    // Auto-finalize active duels that expired
    const expiredActive = await this.prisma.duel.findMany({
      where: { status: 'active', expiresAt: { lt: now } },
    });

    for (const duel of expiredActive) {
      const hasAnyAnswers =
        Object.keys(duel.initiatorAnswers || {}).length > 0 ||
        Object.keys(duel.opponentAnswers || {}).length > 0;

      if (hasAnyAnswers) {
        try {
          await this.finalizeDuel(duel.id);
        } catch {
          await this.prisma.duel.updateMany({
            where: { id: duel.id, status: { not: 'finished' } },
            data: { status: 'expired' },
          });
        }
      } else {
        await this.prisma.duel.update({ where: { id: duel.id }, data: { status: 'expired' } });
      }
    }

    return { expiredPending: 0, autoFinalized: expiredActive.length };
  }
}
