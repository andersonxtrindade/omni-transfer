import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TransfersProducer } from './transfer.producer';

@Controller('transfer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('auth')
export class TransfersController {
  constructor(
    private readonly transfersService: TransfersService,
    private readonly transfersProducer: TransfersProducer
  ) {}

  @Post()
  @HttpCode(204)
  async syncTransfer(@Body() dto: CreateTransferDto): Promise<void> {
    await this.transfersService.processTransfer(dto);
  }

  @Post('queue')
  @HttpCode(204)
  async asyncTransfer(@Body() dto: CreateTransferDto): Promise<void> {
    await this.transfersProducer.enqueueTransfer(dto);
  }
}
