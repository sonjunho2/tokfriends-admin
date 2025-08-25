// 자동 시드: admin 유저가 없으면 생성 (idempotent)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@local';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('[seed] admin exists:', email);
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    // 프로젝트마다 컬럼명이 다를 수 있어 passwordHash 우선, 없으면 password로 시도
    let created;
    try {
      created = await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
    } catch (e) {
      // passwordHash 컬럼이 없으면 password 컬럼으로 재시도
      created = await prisma.user.create({
        data: {
          email,
          password: hash,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
    }

    console.log('[seed] admin created:', created.email);
  } catch (e) {
    console.error('[seed] skipped with error:', e.message);
    // 에러가 나도 앱 부팅은 계속되게 종료코드는 0으로
    process.exitCode = 0;
  } finally {
    await prisma.$disconnect();
  }
})();
