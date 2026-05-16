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
    // 1. Return existing active duel for this user (resume support)
    const existingActiveDuel = await this.prisma.duel.findFirst({
      where: {
        OR: [{ initiatorId: userId }, { opponentId: userId }],
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActiveDuel) {
      return this.getDuelWithQuestions(existingActiveDuel, userId);
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

    // 3. Resume own pending duel if exists
    const existingPending = await this.prisma.duel.findFirst({
      where: { initiatorId: userId, status: 'pending', expiresAt: { gt: new Date() } },
    });
    if (existingPending) {
      return this.getDuelWithQuestions(existingPending, userId);
    }

    // 4. Create new pending duel
    const questions: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id FROM "Question" WHERE status = 'active' ORDER BY RANDOM() LIMIT 7
    `);

    if (questions.length < 7) throw new BadRequestException('Not enough questions for a duel');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newDuel = await this.prisma.duel.create({
      data: {
        initiatorId: userId,
        questionIds: questions.map((q) => q.id),
        status: 'pending',
        expiresAt,
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

    const sortedQuestions = duel.questionIds.map((id: number) => questions.find((q) => q.id === id));

    return {
      duelId: duel.id,
      status: duel.status,
      role: duel.initiatorId === userId ? 'initiator' : 'opponent',
      questions: sortedQuestions,
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
    const duel = await this.prisma.duel.findUnique({ where: { id: duelId } });
    if (!duel) throw new NotFoundException('Duel not found');

    const isInitiator = duel.initiatorId === userId;
    const isOpponent = duel.opponentId === userId;
    if (!isInitiator && !isOpponent) throw new ForbiddenException('Access denied');

    if (duel.status !== 'active' && duel.status !== 'pending')
      throw new BadRequestException('Duel is not playable');

    if (new Date() > duel.expiresAt) {
      await this.prisma.duel.update({ where: { id: duelId }, data: { status: 'expired' } });
      throw new BadRequestException('Duel expired');
    }

    const answers: any = isInitiator ? (duel.initiatorAnswers || {}) : (duel.opponentAnswers || {});
    if (answers[questionId]) throw new BadRequestException('Already answered');

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new BadRequestException('Question not found');

    const isCorrect = question.correctOption === selectedOption && timeSpentMs <= 10000;

    let scoreEarned = 0;
    if (isCorrect) {
      scoreEarned = 100;
      if (timeSpentMs <= 2000) scoreEarned += 50;
      else if (timeSpentMs <= 5000) scoreEarned += 30;
      else if (timeSpentMs <= 8000) scoreEarned += 10;
    }

    answers[questionId] = { choice: selectedOption, time: timeSpentMs, correct: isCorrect, score: scoreEarned };

    const updateData: any = {};
    if (isInitiator) {
      updateData.initiatorAnswers = answers;
      updateData.initiatorScore = { increment: scoreEarned };
    } else {
      updateData.opponentAnswers = answers;
      updateData.opponentScore = { increment: scoreEarned };
    }

    await this.prisma.duel.update({ where: { id: duelId }, data: updateData });

    return {
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanationAz,
      scoreEarned,
    };
  }

  async finishSide(userId: string, duelId: string) {
    const duel = await this.prisma.duel.findUnique({
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
      return this.finalizeDuel(duel.id);
    }

    return { status: duel.status, message: 'Waiting for the other player' };
  }

  private async finalizeDuel(duelId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for consistency
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
      const finishedDuel = await tx.duel.update({
        where: { id: duel.id, status: { not: 'finished' } },
        data: { status: 'finished', finishedAt: new Date(), winnerId, prizeCoins },
      });

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
    });
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

    return this.prisma.duel.update({
      where: { id: duelId },
      data: { status: 'cancelled' },
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
