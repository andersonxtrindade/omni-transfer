import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ example: 'userid-123' })
  @IsUUID()
  fromId: string;

  @ApiProperty({ example: 'userid-321' })
  @IsUUID()
  toId: string;

  @ApiProperty({ example: 10.30, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
