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
      const user = await client.user.findUnique({
        where: { id: userId },
        select: { balanceCoins: true },
      });

      if (!user || user.balanceCoins < amount) {
        throw new BadRequestException('Insufficient coins');
      }

      await client.user.update({
        where: { id: userId },
        data: { balanceCoins: { decrement: amount } },
      });

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
