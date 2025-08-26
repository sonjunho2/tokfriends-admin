import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // "User" 테이블의 email / passwordHash 기준으로 인증
  async validateUser(email: string, plainPassword: string) {
    // 1) adminUser 모델이 있으면 먼저 시도(있으면 유지)
    try {
      // @ts-ignore
      if (this.prisma.adminUser?.findUnique) {
        const au = await this.prisma.adminUser.findUnique({ where: { email } });
        if (au && au.passwordHash && (await bcrypt.compare(plainPassword, au.passwordHash))) {
          return au;
        }
      }
    } catch { /* noop */ }

    // 2) "User" 테이블에서 직접 조회 (네 DB 스키마에 맞춤)
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; email: string; role?: string | null; passwordHash?: string | null }>
    >`SELECT id, email, role, "passwordHash" FROM "User" WHERE email = ${email} LIMIT 1;`.catch(() => []);

    const rec = rows[0];
    if (!rec?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(plainPassword, rec.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return rec;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: { id: user.id, email: user.email, role: user.role ?? 'SUPER_ADMIN' },
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; email: string; "passwordHash"?: string | null }>
    >`SELECT id, email, "passwordHash" FROM "User" WHERE id = ${userId} LIMIT 1;`.catch(() => []);
    const rec = rows[0];
    if (!rec?.passwordHash) throw new UnauthorizedException('Invalid password');

    const ok = await bcrypt.compare(oldPassword, rec.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$executeRaw`
      UPDATE "User" SET "passwordHash" = ${newHash} WHERE id = ${userId};
    `;
    return { message: 'Password changed successfully' };
  }
}
