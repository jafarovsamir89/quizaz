import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaderboardsService {
  constructor(private prisma: PrismaService) {}

  private getInterval(period: string): string | null {
    switch (period) {
      case 'daily': return '1 day';
      case 'weekly': return '7 days';
      case 'monthly': return '30 days';
      default: return null;
    }
  }

  async getCitiesRanking(period: string) {
    const intervalStr = this.getInterval(period);
    const whereClause = intervalStr ? Prisma.sql`WHERE l."createdAt" >= NOW() - ${intervalStr}::interval` : Prisma.sql``;

    const query = Prisma.sql`
      SELECT 
        c.id as "cityId", 
        c."nameAz" as "cityName", 
        SUM(l.amount)::int as "totalPoints",
        COUNT(DISTINCT l."userId")::int as "playersCount"
      FROM "City" c
      JOIN "CityPointsLog" l ON c.id = l."cityId"
      ${whereClause}
      GROUP BY c.id, c."nameAz"
      ORDER BY "totalPoints" DESC
    `;

    const results: any[] = await this.prisma.$queryRaw(query);
    return {
      period,
      items: results.map((item, index) => ({ ...item, rank: index + 1 })),
      updatedAt: new Date(),
    };
  }

  async getPlayersRanking(period: string, cityId?: number) {
    const intervalStr = this.getInterval(period);
    const conditions: Prisma.Sql[] = [Prisma.sql`s.status = 'finished'`];
    
    if (intervalStr) {
      conditions.push(Prisma.sql`s."finishedAt" >= NOW() - ${intervalStr}::interval`);
    }
    if (cityId) {
      conditions.push(Prisma.sql`u."cityId" = ${cityId}`);
    }

    const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.sql``;

    const query = Prisma.sql`
      SELECT 
        u.id as "userId", 
        u.nickname, 
        u."avatarUrl", 
        c."nameAz" as "cityName",
        SUM(s."totalScore")::int as "totalPoints",
        COUNT(s.id)::int as "gamesCount",
        AVG(s."totalScore")::float as "averageScore"
      FROM "User" u
      JOIN "GameSession" s ON u.id = s."userId"
      LEFT JOIN "City" c ON u."cityId" = c.id
      ${whereClause}
      GROUP BY u.id, u.nickname, u."avatarUrl", c."nameAz"
      ORDER BY "totalPoints" DESC
      LIMIT 100
    `;

    const results: any[] = await this.prisma.$queryRaw(query);
    return {
      period,
      items: results.map((item, index) => ({ ...item, rank: index + 1 })),
      updatedAt: new Date(),
    };
  }

  async getMyRank(userId: string, period: string) {
    const intervalStr = this.getInterval(period);
    
    // 1. Global Rank
    const intervalFilter = intervalStr ? Prisma.sql`AND "finishedAt" >= NOW() - ${intervalStr}::interval` : Prisma.sql``;
    
    const globalQuery = Prisma.sql`
      WITH Rankings AS (
        SELECT "userId", SUM("totalScore") as total
        FROM "GameSession"
        WHERE status = 'finished' ${intervalFilter}
        GROUP BY "userId"
      )
      SELECT rank::int, total::int FROM (
        SELECT "userId", total, RANK() OVER (ORDER BY total DESC) as rank
        FROM Rankings
      ) r WHERE "userId" = ${userId}
    `;

    // 2. City Rank
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { cityId: true } });
    let cityRank = null;
    
    if (user?.cityId) {
        const cityIntervalFilter = intervalStr ? Prisma.sql`AND s."finishedAt" >= NOW() - ${intervalStr}::interval` : Prisma.sql``;
        const cityQuery = Prisma.sql`
            WITH Rankings AS (
                SELECT s."userId", SUM(s."totalScore") as total
                FROM "GameSession" s
                JOIN "User" u ON s."userId" = u.id
                WHERE s.status = 'finished' AND u."cityId" = ${user.cityId} 
                ${cityIntervalFilter}
                GROUP BY s."userId"
            )
            SELECT rank::int, total::int FROM (
                SELECT "userId", total, RANK() OVER (ORDER BY total DESC) as rank
                FROM Rankings
            ) r WHERE "userId" = ${userId}
        `;
        const cityRes: any[] = await this.prisma.$queryRaw(cityQuery);
        if (cityRes.length > 0) cityRank = cityRes[0];
    }

    const globalRes: any[] = await this.prisma.$queryRaw(globalQuery);
    const globalRank = globalRes.length > 0 ? globalRes[0] : { rank: 0, total: 0 };

    return {
      period,
      global: globalRank,
      city: cityRank || { rank: 0, total: 0 },
      updatedAt: new Date(),
    };
  }
}
