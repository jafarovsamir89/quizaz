import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('cities')
  async getCities() {
    return this.prisma.city.findMany({
      orderBy: { nameAz: 'asc' },
    });
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany();
  }
}
