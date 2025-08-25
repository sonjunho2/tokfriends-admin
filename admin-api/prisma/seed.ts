import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create super admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@local' },
    update: {},
    create: {
      email: 'admin@local',
      passwordHash: adminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Seed banned words
  const bannedWords = [
    { word: '욕설1', severity: 'HIGH', note: '심각한 욕설' },
    { word: '욕설2', severity: 'HIGH', note: '심각한 욕설' },
    { word: '비속어1', severity: 'MEDIUM', note: '일반 비속어' },
    { word: '비속어2', severity: 'MEDIUM', note: '일반 비속어' },
    { word: '스팸', severity: 'LOW', note: '스팸 관련' },
    { word: '광고', severity: 'LOW', note: '광고 관련' },
    { word: '도박', severity: 'HIGH', note: '도박 관련' },
    { word: '불법', severity: 'HIGH', note: '불법 관련' },
    { word: '성인', severity: 'MEDIUM', note: '성인 콘텐츠' },
    { word: '음란', severity: 'HIGH', note: '음란물' },
    { word: '사기', severity: 'HIGH', note: '사기 관련' },
    { word: '해킹', severity: 'HIGH', note: '해킹 관련' },
    { word: '바이러스', severity: 'MEDIUM', note: '악성코드' },
    { word: '피싱', severity: 'HIGH', note: '피싱 관련' },
    { word: '마약', severity: 'HIGH', note: '마약 관련' },
    { word: '폭력', severity: 'MEDIUM', note: '폭력 관련' },
    { word: '차별', severity: 'MEDIUM', note: '차별 표현' },
    { word: '혐오', severity: 'HIGH', note: '혐오 표현' },
    { word: '테스트금칙어', severity: 'LOW', note: '테스트용' },
    { word: '금지단어', severity: 'MEDIUM', note: '일반 금지' },
  ];

  for (const word of bannedWords) {
    await prisma.bannedWord.upsert({
      where: { word: word.word },
      update: {},
      create: word as any,
    });
  }

  // Seed sample app users
  const sampleUsers = [
    { email: 'user1@example.com', nickname: '사용자1', status: 'ACTIVE' },
    { email: 'user2@example.com', nickname: '사용자2', status: 'ACTIVE' },
    { email: 'user3@example.com', nickname: '사용자3', status: 'SUSPENDED' },
    { email: 'user4@example.com', nickname: '사용자4', status: 'ACTIVE' },
    { email: 'user5@example.com', nickname: '사용자5', status: 'ACTIVE' },
  ];

  for (const user of sampleUsers) {
    await prisma.appUser.upsert({
      where: { email: user.email },
      update: {},
      create: user as any,
    });
  }

  // Seed sample reports
  const users = await prisma.appUser.findMany();
  if (users.length >= 2) {
    await prisma.report.create({
      data: {
        reporterUserId: users[0].id,
        targetUserId: users[1].id,
        category: '욕설/비방',
        detail: '부적절한 언어 사용',
        status: 'PENDING',
      },
    });

    await prisma.report.create({
      data: {
        reporterUserId: users[1].id,
        targetUserId: users[2].id,
        category: '스팸',
        detail: '반복적인 광고 게시',
        status: 'PENDING',
      },
    });
  }

  // Seed sample announcement
  await prisma.announcement.create({
    data: {
      title: '딱친 서비스 이용 안내',
      body: '안녕하세요. 딱친 서비스를 이용해 주셔서 감사합니다. 건전한 커뮤니티 문화를 위해 이용 규칙을 준수해 주세요.',
      isActive: true,
      startsAt: new Date(),
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });