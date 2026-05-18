import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class HeroesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async onModuleInit() {
    // Seed default Azerbaijani Hero Cards on startup if they don't exist
    const defaultHeroes = [
      {
        nameKey: 'koroghlu',
        nameAz: 'Koroğlu',
        nameRu: 'Короглу',
        rarity: 'epic',
        perkType: 'time_boost',
        perkValue: 1.5,
        descriptionAz: 'QırAt sayəsində suallara 50% daha sürətli cavab verin, lakin düzgün cavablar üçün 1.5x xal qazanın!',
        descriptionRu: 'Благодаря коню Гырат отвечайте на 50% быстрее, но получайте 1.5x очков за правильные ответы!',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
      },
      {
        nameKey: 'nizami',
        nameAz: 'Nizami Gəncəvi',
        nameRu: 'Низами Гянджеви',
        rarity: 'legendary',
        perkType: 'remove_wrong',
        perkValue: 2,
        descriptionAz: 'Hər oyunda ədəbiyyat/tarix suallarında 2 səhv variantı avtomatik olaraq silir (50/50 bonusu).',
        descriptionRu: 'В каждой игре по литературе/истории автоматически удаляет 2 неверных варианта (бонус 50/50).',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      },
      {
        nameKey: 'babek',
        nameAz: 'Babək',
        nameRu: 'Бабек',
        rarity: 'legendary',
        perkType: 'revive',
        perkValue: 1,
        descriptionAz: 'Sınılmaz müdafiə: Hər oyunda 1 səhv cavabın cəriməsini sıfırlayır (bir can bərpa edir).',
        descriptionRu: 'Несокрушимая защита: Сбрасывает штраф за 1 неверный ответ в игре (восстанавливает одну жизнь).',
        imageUrl: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=500',
      },
      {
        nameKey: 'mushfig',
        nameAz: 'Mikayıl Müşfiq',
        nameRu: 'Микаил Мушфиг',
        rarity: 'rare',
        perkType: 'xp_boost',
        perkValue: 1.25,
        descriptionAz: 'Poeziya ruhu: Poeziya və incəsənət kateqoriyalı suallarda +25% daha çox təcrübə (XP) qazanın.',
        descriptionRu: 'Поэтический дух: Получайте на 25% больше опыта (XP) в вопросах о поэзии и искусстве.',
        imageUrl: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=500',
      },
      {
        nameKey: 'lutfizadeh',
        nameAz: 'Lütfi Zadə',
        nameRu: 'Лютфи Заде',
        rarity: 'epic',
        perkType: 'xp_boost',
        perkValue: 1.3,
        descriptionAz: 'Qeyri-səlis məntiq: Riyaziyyat, elm və texnologiya suallarında +30% daha çox XP qazandırır.',
        descriptionRu: 'Нечеткая логика: Приносит на 30% больше опыта (XP) в вопросах науки и математики.',
        imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=500',
      },
    ];

    for (const h of defaultHeroes) {
      await this.prisma.hero.upsert({
        where: { nameKey: h.nameKey },
        update: h,
        create: h,
      });
    }
  }

  async getAllHeroes() {
    return this.prisma.hero.findMany();
  }

  async getUserHeroes(userId: string) {
    return this.prisma.userHero.findMany({
      where: { userId },
      include: { hero: true },
    });
  }

  async equipHero(userId: string, userHeroId: string, equip: boolean) {
    const userHero = await this.prisma.userHero.findUnique({
      where: { id: userHeroId },
      include: { hero: true },
    });
    if (!userHero || userHero.userId !== userId) {
      throw new NotFoundException('Qəhrəman kartı tapılmadı');
    }

    if (equip) {
      // Limit to max 3 equipped heroes
      const equippedCount = await this.prisma.userHero.count({
        where: { userId, isEquipped: true },
      });
      if (equippedCount >= 3) {
        throw new BadRequestException('Maksimum 3 qəhrəman kartı təchiz edilə bilər');
      }
    }

    return this.prisma.userHero.update({
      where: { id: userHeroId },
      data: { isEquipped: equip },
      include: { hero: true },
    });
  }

  async openChest(userId: string) {
    const chestCost = 500; // 500 coins per chest

    // Check user balance first
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balanceCoins: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.balanceCoins < chestCost) {
      throw new BadRequestException('Kifayət qədər qızılınız yoxdur (500 qızıl lazımdır)');
    }

    // Roll rarity
    const rand = Math.random() * 100;
    let selectedRarity = 'common';
    if (rand < 2) selectedRarity = 'legendary';
    else if (rand < 10) selectedRarity = 'epic';
    else if (rand < 35) selectedRarity = 'rare';

    // Get all heroes of that rarity
    let pool = await this.prisma.hero.findMany({
      where: { rarity: selectedRarity },
    });

    // Fallback if rarity pool is empty
    if (pool.length === 0) {
      pool = await this.prisma.hero.findMany();
    }

    const rolledHero = pool[Math.floor(Math.random() * pool.length)];

    return this.prisma.$transaction(async (tx) => {
      // 1. Spend coins
      await this.wallet.spendCoins(userId, chestCost, 'buy_hero_chest', {}, tx);

      // 2. Add or increment hero copies
      const existing = await tx.userHero.findUnique({
        where: {
          userId_heroId: {
            userId,
            heroId: rolledHero.id,
          },
        },
      });

      let userHero;
      if (existing) {
        userHero = await tx.userHero.update({
          where: { id: existing.id },
          data: { copies: existing.copies + 1 },
          include: { hero: true },
        });
      } else {
        userHero = await tx.userHero.create({
          data: {
            userId,
            heroId: rolledHero.id,
            copies: 1,
            level: 1,
          },
          include: { hero: true },
        });
      }

      return {
        rolledHero,
        userHero,
        balanceCoins: user.balanceCoins - chestCost,
      };
    });
  }

  async levelUpHero(userId: string, userHeroId: string) {
    const userHero = await this.prisma.userHero.findUnique({
      where: { id: userHeroId },
      include: { hero: true },
    });

    if (!userHero || userHero.userId !== userId) {
      throw new NotFoundException('Qəhrəman tapılmadı');
    }

    const nextLevel = userHero.level + 1;
    const copiesRequired = userHero.level * 2; // e.g. Level 1->2 needs 2 copies, 2->3 needs 4
    const goldRequired = userHero.level * 300; // Level 1->2 needs 300 coins, 2->3 needs 600

    if (userHero.copies < copiesRequired) {
      throw new BadRequestException(`Təkmilləşdirmək üçün ${copiesRequired} nüsxə lazımdır (sizdə: ${userHero.copies})`);
    }

    // Check balance
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balanceCoins: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.balanceCoins < goldRequired) {
      throw new BadRequestException(`Təkmilləşdirmək üçün ${goldRequired} qızıl lazımdır (sizdə: ${user.balanceCoins})`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Spend coins
      await this.wallet.spendCoins(userId, goldRequired, `levelup_hero_${userHero.hero.nameKey}`, {}, tx);

      // Decrement copies and increment level
      const updated = await tx.userHero.update({
        where: { id: userHeroId },
        data: {
          level: nextLevel,
          copies: userHero.copies - copiesRequired,
        },
        include: { hero: true },
      });

      return {
        userHero: updated,
        balanceCoins: user.balanceCoins - goldRequired,
      };
    });
  }

  async awardRandomHero(userId: string, rarity: string) {
    let pool = await this.prisma.hero.findMany({
      where: { rarity },
    });
    if (pool.length === 0) {
      pool = await this.prisma.hero.findMany();
    }
    const rolledHero = pool[Math.floor(Math.random() * pool.length)];

    const existing = await this.prisma.userHero.findUnique({
      where: {
        userId_heroId: {
          userId,
          heroId: rolledHero.id,
        },
      },
    });

    if (existing) {
      return this.prisma.userHero.update({
        where: { id: existing.id },
        data: { copies: existing.copies + 1 },
      });
    } else {
      return this.prisma.userHero.create({
        data: {
          userId,
          heroId: rolledHero.id,
          copies: 1,
          level: 1,
        },
      });
    }
  }
}
