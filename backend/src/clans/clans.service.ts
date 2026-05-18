import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClansService {
  constructor(private readonly prisma: PrismaService) {}

  async createClan(userId: string, name: string, type: string, logoUrl?: string) {
    if (!['neighborhood', 'school', 'university'].includes(type)) {
      throw new BadRequestException('Klan növü düzgün deyil (neighborhood, school, university olmalıdır)');
    }

    const existing = await this.prisma.clan.findUnique({
      where: { name },
    });
    if (existing) {
      throw new BadRequestException('Bu adda klan (məktəb/universitet/məhəllə) artıq mövcuddur');
    }

    return this.prisma.$transaction(async (tx) => {
      const clan = await tx.clan.create({
        data: {
          name,
          type,
          logoUrl,
        },
      });

      // Automatically join the newly created clan
      await tx.user.update({
        where: { id: userId },
        data: { clanId: clan.id },
      });

      return clan;
    });
  }

  async joinClan(userId: string, clanId: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
    });
    if (!clan) throw new NotFoundException('Klan tapılmadı');

    return this.prisma.user.update({
      where: { id: userId },
      data: { clanId },
      include: { clan: true },
    });
  }

  async leaveClan(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { clanId: null },
      include: { clan: true },
    });
  }

  async getClanDetails(clanId: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        members: {
          select: {
            id: true,
            nickname: true,
            level: true,
            xp: true,
            avatarUrl: true,
          },
          orderBy: { xp: 'desc' },
        },
      },
    });

    if (!clan) throw new NotFoundException('Klan tapılmadı');
    return clan;
  }

  async getLeaderboard(type: string) {
    if (!['neighborhood', 'school', 'university'].includes(type)) {
      throw new BadRequestException('Klan növü düzgün deyil');
    }

    return this.prisma.clan.findMany({
      where: { type },
      orderBy: { points: 'desc' },
      take: 50,
    });
  }

  async addPoints(clanId: string, points: number) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      select: { points: true, level: true },
    });
    if (!clan) return;

    const newPoints = clan.points + points;
    // Simple level up calculation for clans: 10,000 points per level
    const newLevel = Math.floor(newPoints / 10000) + 1;

    await this.prisma.clan.update({
      where: { id: clanId },
      data: {
        points: newPoints,
        level: newLevel,
      },
    });
  }
}
