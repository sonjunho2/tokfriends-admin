import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    // username 대신 email로 받게 설정
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    // 성공 시 user 객체, 실패 시 UnauthorizedException
    const user = await this.authService.validateUser(email, password);
    return user;
  }
}
