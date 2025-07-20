import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...' })
  access_token: string;

  @ApiProperty({ example: '3600s' })
  expiresIn: string;
}
