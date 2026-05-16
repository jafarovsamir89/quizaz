import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionReportDto } from './dto/create-question-report.dto';

@Injectable()
export class QuestionReportsService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionReportDto: CreateQuestionReportDto) {
    return this.prisma.questionReport.create({
      data: createQuestionReportDto as any,
    });
  }

  async findAll() {
    return this.prisma.questionReport.findMany({
      include: { question: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: number, adminComment: string) {
    return this.updateStatus(id, 'resolved', adminComment);
  }

  async updateStatus(id: number, status: 'open' | 'resolved' | 'ignored', adminComment?: string) {
    const report = await this.prisma.questionReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException(`Report #${id} not found`);

    return this.prisma.questionReport.update({
      where: { id },
      data: { status, ...(adminComment !== undefined ? { adminComment } : {}) },
    });
  }
}
