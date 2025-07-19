import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsDateString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'andersonxtrindade' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '2000-09-17' })
  @IsDateString()
  birthdate: string;
}