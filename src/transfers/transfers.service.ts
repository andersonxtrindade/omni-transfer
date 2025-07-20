import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfers } from './entities/transfers.entity';
import { Repository } from 'typeorm';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { UsersService } from 'src/users/users.service';
import { Users } from 'src/users/entities/users.entity';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfers, 'omni')
    private readonly transferRepository: Repository<Transfers>,
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransfersService.name);
  }

  async processTransfer(dto: CreateTransferDto): Promise<void> {
    this.logger.info(`Starting transfer from user ${dto.fromId} to user ${dto.toId} with amount ${dto.amount}`);

    try {
      await this.usersService.transferBalance(dto.fromId, dto.toId, dto.amount);
      this.logger.info(`Balance successfully transferred from user ${dto.fromId} to user ${dto.toId}`);

      const transfer = this.transferRepository.create({
        sender: { id: dto.fromId } as Users,
        receiver: { id: dto.toId } as Users,
        amount: dto.amount,
      });

      await this.transferRepository.save(transfer);
      this.logger.info(`Transfer record saved successfully`);
    } catch (error) {
      this.logger.error('Error occurred during transfer process', error);
      throw error;
    }
  }
}
