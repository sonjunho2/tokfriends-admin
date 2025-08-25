import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

type AnyUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  passwordHash?: string | null;
  password?: string | null;
  password_hash?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 이메일로 관리자 찾고 비번 검증.
   * 1) prisma.adminUser 우선
   * 2) 없으면 users / "User" 테이블을 Raw SQL로 조회
   */
  async validateUser(email: string, plainPassword: string) {
    let user: AnyUser | null = null;
    let source: 'adminUser' | 'raw' | null = null;

    // 1) adminUser 모델이 있으면 우선 시도
    try {
      // @ts-ignore - 모델 유무 환경별 차이 고려
      if (this.prisma.adminUser?.findUnique) {
        const u = await this.prisma.adminUser.findUnique({ where: { email } });
        if (u) {
          user = {
            id: (u as any).id,
            email: (u as any).email,
            name: (u as any).name ?? null,
            role: (u as any).role ?? null,
            isActive: (u as any).isActive ?? true,
            passwordHash: (u as any).passwordHash ?? null,
            password: (u as any).password ?? null,
            password_hash: (u as any).password_hash ?? null,
          };
          source = 'adminUser';
        }
      }
    } catch {
      // noop
    }

    // 2) adminUser에서 못 찾았으면 Raw SQL (users → "User" 순서)
    if (!user) {
      const rowsUsers = await this.prisma.$queryRaw<
        AnyUser[]
      >`SELECT id, email, role, name, "isActive", "passwordHash", password, password_hash FROM users WHERE email = ${email} LIMIT 1;`
        .catch(() => []);
      const rowsUser =
        rowsUsers.length > 0
          ? []
          : await this.prisma.$queryRaw<
              AnyUser[]
            >`SELECT id, email, role, name, "isActive", "passwordHash", password, password_hash FROM "User" WHERE email = ${email} LIMIT 1;`
              .catch(() => []);
      const rec = rowsUsers[0] ?? rowsUser[0];
      if (rec) {
        user = rec;
        source = 'raw';
      }
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isActive === false) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 가능한 해시 컬럼 후보들
    const hashes = [user.passwordHash, user.password, user.password_hash].filter(
      Boolean,
    ) as string[];

    if (hashes.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let ok = false;
    for (const h of hashes) {
      if (await bcrypt.compare(plainPassword, h)) {
        ok = true;
        break;
      }
    }
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // adminUser 테이블이면 마지막 로그인 갱신 (실패해도 무시)
    if (source === 'adminUser') {
      try {
        // @ts-ignore
        await this.prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch {
        /** noop */
      }
    }

    return user;
  }

  async login(user: AnyUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        role: user.role ?? null,
      },
    };
  }

  /**
   * 비밀번호 변경
   * - adminUser 모델이 있으면 거기서 처리
   * - 없으면 users / "User" 테이블에 대해 Raw SQL로 시도
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // 1) adminUser 경로 우선
    try {
      // @ts-ignore
      if (this.prisma.adminUser?.findUnique) {
        // @ts-ignore
        const u = await this.prisma.adminUser.findUnique({ where: { id: userId } });
        if (!u) throw new UnauthorizedException('Invalid password');

        const hashCandidates = [
          (u as any).passwordHash,
          (u as any).password,
          (u as any).password_hash,
        ].filter(Boolean) as string[];

        let ok = false;
        for (const h of hashCandidates) {
          if (await bcrypt.compare(oldPassword, h)) {
            ok = true;
            break;
          }
        }
        if (!ok) throw new UnauthorizedException('Invalid password');

        const newHash = await bcrypt.hash(newPassword, 10);
        // @ts-ignore
        await this.prisma.adminUser.update({
          where: { id: userId },
          data: { passwordHash: newHash },
        });
        return { message: 'Password changed successfully' };
      }
    } catch {
      // adminUser 경로 실패시 raw로 이동
    }

    // 2) Raw SQL 경로(users / "User") — 현재 로그인 사용자의 id가 어느 테이블 id인지 모르면 실패 가능
    const newHash = await bcrypt.hash(newPassword, 10);

    // users 우선
    try {
      const rows = await this.prisma.$executeRaw`
        UPDATE users
        SET "passwordHash" = ${newHash}
        WHERE id = ${userId}
      `;
      if ((rows as unknown as number) > 0) {
        return { message: 'Password changed successfully' };
      }
    } catch {
      /* try next */
    }
    try {
      const rows = await this.prisma.$executeRaw`
        UPDATE users
        SET password = ${newHash}
        WHERE id = ${userId}
      `;
      if ((rows as unknown as number) > 0) {
        return { message: 'Password changed successfully' };
      }
    } catch {
      /* try next */
    }
    try {
      const rows = await this.prisma.$executeRaw`
        UPDATE users
        SET password_hash = ${newHash}
        WHERE id = ${userId}
      `;
      if ((rows as unknown as number) > 0) {
        return { message: 'Password changed successfully' };
      }
    } catch {
      /* try next */
    }

    // "User" 테이블도 시도
    try {
      const rows = await this.prisma.$executeRaw`
        UPDATE "User"
        SET "passwordHash" = ${newHash}
        WHERE id = ${userId}
      `;
      if ((rows as unknown as number) > 0) {
        return { message: 'Password changed successfully' };
      }
    } catch {
      /* try next */
    }
    try {
      const rows = await this.prisma.$executeRaw`
        UPDATE "User"
        SET password = ${newHash}
        WHERE id = ${userId}
      `;
      if ((rows as unknown as number) > 0) {
        return { message: 'Password changed successfully' };
      }
    } catch {
      /* try next */
    }
    try {
      const rows = await this.prisma.$executeRaw`
        UPDATE "User"
        SET password_hash = ${newHash}
        WHERE id = ${userId}
      `;
      if ((rows as unknown as number) > 0) {
        return { message: 'Password changed successfully' };
      }
    } catch {
      /* try next */
    }

    throw new UnauthorizedException('Invalid password');
  }
}
