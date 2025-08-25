import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannedWordsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bannedWord.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.bannedWord.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.bannedWord.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.bannedWord.delete({
      where: { id },
    });
  }
}