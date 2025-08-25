import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      newUsersDay,
      newUsersWeek,
      newUsersMonth,
      pendingReports,
      totalReports,
      bannedWordsCount,
      activeAnnouncements,
    ] = await Promise.all([
      this.prisma.appUser.count(),
      this.prisma.appUser.count({ where: { status: 'ACTIVE' } }),
      this.prisma.appUser.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.appUser.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.appUser.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.appUser.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.report.count(),
      this.prisma.bannedWord.count(),
      this.prisma.announcement.count({ where: { isActive: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      newUsers: {
        day: newUsersDay,
        week: newUsersWeek,
        month: newUsersMonth,
      },
      reports: {
        pending: pendingReports,
        total: totalReports,
      },
      bannedWords: bannedWordsCount,
      activeAnnouncements,
    };
  }
}