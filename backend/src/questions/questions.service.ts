import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: createQuestionDto as any,
    });
  }

  async findAll() {
    return this.prisma.question.findMany({
      where: { status: { not: 'deleted' } },
      include: { category: true },
    });
  }

  async findOne(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!question) throw new NotFoundException(`Question with ID ${id} not found`);
    return question;
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return this.prisma.question.update({
      where: { id },
      data: updateQuestionDto as any,
    });
  }

  async remove(id: number) {
    return this.prisma.question.update({
      where: { id },
      data: { status: 'deleted' },
    });
  }

  async getRandom(categoryId?: number, difficulty?: number, limit = 1) {
    // Note: Raw query for random as Prisma doesn't have native random offset
    const conditions: Prisma.Sql[] = [Prisma.sql`"status" = 'active'`];
    if (categoryId) conditions.push(Prisma.sql`"categoryId" = ${categoryId}`);
    if (difficulty) conditions.push(Prisma.sql`"difficulty" = ${difficulty}`);

    const whereClause = Prisma.join(conditions, ' AND ');
    
    const questions: any[] = await this.prisma.$queryRaw`
      SELECT id, "categoryId", "textAz", options, difficulty, "explanationAz" FROM "Question" 
      WHERE ${whereClause}
      ORDER BY RANDOM() 
      LIMIT ${limit}
    `;

    // Security: Remove correctOption for random requests (client-side)
    return questions.map((q) => {
      const { correctOption, ...rest } = q;
      return rest;
    });
  }

  async importBulk(questions: CreateQuestionDto[]) {
    const result = await this.prisma.question.createMany({
      data: questions as any[],
      skipDuplicates: true,
    });
    return { imported: result.count, total: questions.length };
  }
}
