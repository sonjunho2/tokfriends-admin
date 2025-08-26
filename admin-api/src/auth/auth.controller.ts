import { Controller, Post, UseGuards, Request, Get, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@ApiBearerAuth() // 🔒 이 컨트롤러의 엔드포인트들에 Bearer 토큰 사용
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Admin login' })
  @ApiBody({ type: LoginDto, required: true }) // ✅ Swagger 입력칸 생성
  @HttpCode(200) // 기본 201 → 200으로 고정
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@Request() req) {
    return req.user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: 'Admin123!' },
        newPassword: { type: 'string', example: 'NewPass!234' },
      },
      required: ['oldPassword', 'newPassword'],
    },
  })
  async changePassword(@Request() req, @Body() body: any) {
    return this.authService.changePassword(
      req.user.userId ?? req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }
}
