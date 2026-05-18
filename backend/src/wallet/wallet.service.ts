import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balanceCoins: true },
    });
    return user?.balanceCoins || 0;
  }

  async addCoins(userId: string, amount: number, transactionType: string, metadata: any = {}, tx?: any) {
    if (amount <= 0) return;

    const execute = async (client: any) => {
      await client.user.update({
        where: { id: userId },
        data: { balanceCoins: { increment: amount } },
      });

      return client.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'earn',
          transactionType,
          metadata,
        },
      });
    };

    if (tx) return execute(tx);
    return this.prisma.$transaction(async (client) => execute(client));
  }

  async spendCoins(userId: string, amount: number, transactionType: string, metadata: any = {}, tx?: any) {
    if (amount <= 0) return;

    const execute = async (client: any) => {
      // Use updateMany to ensure we only decrement if balance is >= amount
      // This is an atomic operation that prevents race conditions
      const updateResult = await client.user.updateMany({
        where: { 
          id: userId,
          balanceCoins: { gte: amount }
        },
        data: { balanceCoins: { decrement: amount } },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('Insufficient coins');
      }

      return client.walletTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'spend',
          transactionType,
          metadata,
        },
      });
    };

    if (tx) return execute(tx);
    return this.prisma.$transaction(async (client) => execute(client));
  }
}
