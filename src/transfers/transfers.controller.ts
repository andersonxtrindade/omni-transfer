import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('transfer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('auth')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @HttpCode(204)
  async create(@Body() dto: CreateTransferDto): Promise<void> {
    await this.transfersService.transfer(dto);
  }
}
