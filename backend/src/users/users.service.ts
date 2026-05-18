import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { city: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    firebaseUid: string;
    email?: string;
    nickname: string;
    avatarUrl?: string;
    googleId?: string;
  }) {
    return this.prisma.user.create({
      data,
      include: { city: true },
    });
  }

  async update(id: string, data: any) {
    // Prevent sensitive fields from being updated via standard update
    const { balanceCoins, xp, isAdmin, ...safeData } = data;
    return this.prisma.user.update({
      where: { id },
      data: safeData,
    });
  }

  async mergeGuestToGoogle(guestId: string, googleData: any) {
    // Logic: If guest exists, update it with Google data (effectively promoting guest to Google user)
    // If a Google user already exists with that email, we might need a more complex merge strategy
    // For MVP: We assume the client handles the prompt and we just promote the guest.
    return this.prisma.user.update({
      where: { id: guestId },
      data: {
        email: googleData.email,
        googleId: googleData.googleId,
        avatarUrl: googleData.avatarUrl || undefined,
        // keep coins, xp, etc.
      },
      include: { city: true },
    });
  }

  async claimDailyBonus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastDailyBonusAt: true, dailyStreak: true, xp: true, balanceCoins: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    let streak = 1;

    if (user.lastDailyBonusAt) {
      const lastBonusDate = new Date(user.lastDailyBonusAt);
      
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const lastBonusUtc = Date.UTC(lastBonusDate.getUTCFullYear(), lastBonusDate.getUTCMonth(), lastBonusDate.getUTCDate());
      
      const diffDays = Math.floor((todayUtc - lastBonusUtc) / (24 * 60 * 60 * 1000));

      if (diffDays === 0) {
        throw new BadRequestException('Daily bonus already claimed today');
      } else if (diffDays === 1) {
        // Consecutive claim
        streak = user.dailyStreak >= 7 ? 1 : user.dailyStreak + 1;
      } else {
        // Streak broken
        streak = 1;
      }
    }

    const bonusCoins = streak === 7 ? 200 : 50 + (streak - 1) * 10;
    const bonusXp = streak === 7 ? 100 : 10 + (streak - 1) * 5;

    return this.prisma.$transaction(async (tx) => {
      const currentXp = user.xp + bonusXp;
      const newLevel = Math.floor(currentXp / 1000) + 1;

      // 1. Update user fields
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          lastDailyBonusAt: now,
          dailyStreak: streak,
          xp: currentXp,
          level: newLevel
        },
      });

      // 2. Add coins to wallet
      await this.wallet.addCoins(userId, bonusCoins, `daily_bonus_streak_${streak}`, {}, tx);

      return {
        claimed: true,
        streak,
        bonusCoins,
        bonusXp,
        balanceCoins: updatedUser.balanceCoins,
        xp: updatedUser.xp,
        level: updatedUser.level,
      };
    });
  }
}
