import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: any) {
    const { page = 1, limit = 10, status, category } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { handler: true },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: string, handlerId: string) {
    return this.prisma.report.update({
      where: { id },
      data: { 
        status: status as any,
        handledBy: handlerId,
      },
    });
  }
}