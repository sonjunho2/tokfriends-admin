import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@local' })
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  password!: string;
}
