// admin-api/scripts/seed-if-needed.js
// 테이블/컬럼 모양이 달라도 안전하게 "관리자 계정"을 보장하는 시드(모델/컬럼 가정 X)
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function tableExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
    LIMIT 1;
  `
  return rows.length > 0
}

async function existsByEmailUsers(email) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM users WHERE email = ${email} LIMIT 1;
  `
  return rows.length > 0
}

async function existsByEmailUser(email) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM "User" WHERE email = ${email} LIMIT 1;
  `
  return rows.length > 0
}

// 컬럼 조합/제약조건(고유키) 유무에 따라 여러 INSERT 변형을 시도한다.
// ON CONFLICT를 안 가정하고, WHERE NOT EXISTS로 안전하게 처리.
async function tryInsertInto_users(email, hash) {
  const attempts = [
    // passwordHash + role + isActive
    prisma.$executeRaw`
      INSERT INTO users (email, "passwordHash", role, "isActive")
      SELECT ${email}, ${hash}, 'SUPER_ADMIN', true
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // passwordHash + role
    prisma.$executeRaw`
      INSERT INTO users (email, "passwordHash", role)
      SELECT ${email}, ${hash}, 'SUPER_ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // passwordHash only
    prisma.$executeRaw`
      INSERT INTO users (email, "passwordHash")
      SELECT ${email}, ${hash}
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // password + role + isActive
    prisma.$executeRaw`
      INSERT INTO users (email, password, role, "isActive")
      SELECT ${email}, ${hash}, 'SUPER_ADMIN', true
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // password + role
    prisma.$executeRaw`
      INSERT INTO users (email, password, role)
      SELECT ${email}, ${hash}, 'SUPER_ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // password only
    prisma.$executeRaw`
      INSERT INTO users (email, password)
      SELECT ${email}, ${hash}
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // password_hash + role + isActive
    prisma.$executeRaw`
      INSERT INTO users (email, password_hash, role, "isActive")
      SELECT ${email}, ${hash}, 'SUPER_ADMIN', true
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // password_hash + role
    prisma.$executeRaw`
      INSERT INTO users (email, password_hash, role)
      SELECT ${email}, ${hash}, 'SUPER_ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
    // password_hash only
    prisma.$executeRaw`
      INSERT INTO users (email, password_hash)
      SELECT ${email}, ${hash}
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${email});
    `,
  ]

  for (const q of attempts) {
    try {
      await q
      return true
    } catch (e) {
      // 다음 시도
    }
  }
  return false
}

async function tryInsertInto_User(email, hash) {
  const attempts = [
    prisma.$executeRaw`
      INSERT INTO "User" (email, "passwordHash", role, "isActive")
      SELECT ${email}, ${hash}, 'SUPER_ADMIN', true
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, "passwordHash", role)
      SELECT ${email}, ${hash}, 'SUPER_ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, "passwordHash")
      SELECT ${email}, ${hash}
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, password, role, "isActive")
      SELECT ${email}, ${hash}, 'SUPER_ADMIN', true
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, password, role)
      SELECT ${email}, ${hash}, 'SUPER_ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, password)
      SELECT ${email}, ${hash}
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, password_hash, role, "isActive")
      SELECT ${email}, ${hash}, 'SUPER_ADMIN', true
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, password_hash, role)
      SELECT ${email}, ${hash}, 'SUPER_ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
    prisma.$executeRaw`
      INSERT INTO "User" (email, password_hash)
      SELECT ${email}, ${hash}
      WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = ${email});
    `,
  ]

  for (const q of attempts) {
    try {
      await q
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
    const hash = await bcrypt.hash(password, 10)

    const hasUsers = await tableExists('users')
    const hasUser = await tableExists('User')

    if (!hasUsers && !hasUser) {
      console.log('[seed] skip: no users/User table')
      return
    }

    if (hasUsers) {
      const exists = await existsByEmailUsers(email)
      if (exists) {
        console.log('[seed] admin exists:', email)
      } else {
        const ok = await tryInsertInto_users(email, hash)
        console.log(ok ? '[seed] admin created:' : '[seed] insert failed:', email)
      }
      return
    }

    // hasUser
    const exists = await existsByEmailUser(email)
    if (exists) {
      console.log('[seed] admin exists:', email)
    } else {
      const ok = await tryInsertInto_User(email, hash)
      console.log(ok ? '[seed] admin created:' : '[seed] insert failed:', email)
    }
  } catch (e) {
    console.log('[seed] skipped with error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
})()
