// admin-api/scripts/seed-if-needed.js
// 모델(User) 유무와 상관없이 Raw SQL로 관리자 계정을 보장하는 스크립트
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function tableExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name=${name}
    LIMIT 1;
  `
  return rows.length > 0
}

async function selectOneByEmail(table, email) {
  if (table === 'users') {
    const rows = await prisma.$queryRaw`
      SELECT id, email, role, "isActive", "passwordHash", password, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1;
    `
    return rows[0]
  } else {
    const rows = await prisma.$queryRaw`
      SELECT id, email, role, "isActive", "passwordHash", password, password_hash
      FROM "User"
      WHERE email = ${email}
      LIMIT 1;
    `
    return rows[0]
  }
}

async function tryInsert(table, email, hash) {
  // 가능한 컬럼 조합 순차 삽입 시도 (존재하는 컬럼에서 첫 성공으로 종료)
  const attempts = [
    // passwordHash 컬럼
    {
      sqlUsers: prisma.$executeRaw`
        INSERT INTO users (email, "passwordHash", role, "isActive")
        VALUES (${email}, ${hash}, 'SUPER_ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `,
      sqlUser: prisma.$executeRaw`
        INSERT INTO "User" (email, "passwordHash", role, "isActive")
        VALUES (${email}, ${hash}, 'SUPER_ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `,
    },
    // password 컬럼
    {
      sqlUsers: prisma.$executeRaw`
        INSERT INTO users (email, password, role, "isActive")
        VALUES (${email}, ${hash}, 'SUPER_ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `,
      sqlUser: prisma.$executeRaw`
        INSERT INTO "User" (email, password, role, "isActive")
        VALUES (${email}, ${hash}, 'SUPER_ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `,
    },
    // snake_case password_hash 컬럼
    {
      sqlUsers: prisma.$executeRaw`
        INSERT INTO users (email, password_hash, role, "isActive")
        VALUES (${email}, ${hash}, 'SUPER_ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `,
      sqlUser: prisma.$executeRaw`
        INSERT INTO "User" (email, password_hash, role, "isActive")
        VALUES (${email}, ${hash}, 'SUPER_ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `,
    },
  ]

  for (const a of attempts) {
    try {
      if (table === 'users') {
        await a.sqlUsers
      } else {
        await a.sqlUser
      }
      return true
    } catch (e) {
      // 다음 시도
    }
  }
  return false
}

;(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@local'
    const password = process.env.ADMIN_PASSWORD || 'Admin123!'

    const usersExists = await tableExists('users')
    const UserExists = await tableExists('User')

    if (!usersExists && !UserExists) {
      console.log('[seed] skip: no users table (users/User) found')
      return
    }

    const targetTable = usersExists ? 'users' : 'User'
    const existing = await selectOneByEmail(targetTable, email)
    if (existing) {
      console.log('[seed] admin exists:', existing.email)
      return
    }

    const hash = await bcrypt.hash(password, 10)
    const ok = await tryInsert(targetTable, email, hash)
    if (ok) {
      console.log('[seed] admin created:', email)
    } else {
      console.log('[seed] insert failed: no suitable password column')
    }
  } catch (e) {
    console.log('[seed] skipped with error:', e.message)
    // 에러 무시하고 앱 부팅 계속
  } finally {
    await prisma.$disconnect()
  }
})()
