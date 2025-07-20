import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class TransfersProducer {
  constructor(
    @InjectQueue('transfer-queue')
    private readonly transferQueue: Queue,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransfersProducer.name);
  }

  async enqueueTransfer(dto: CreateTransferDto): Promise<void> {
    this.logger.info(`Enqueueing transfer job: from ${dto.fromId} to ${dto.toId}, amount: ${dto.amount}`);

    try {
      await this.transferQueue.add('transfer-job', dto, {
        attempts: 3,
        backoff: 2000,
        removeOnComplete: false,
      });
      this.logger.info('Transfer job added successfully');
    } catch (error) {
      this.logger.error('Failed to enqueue transfer job', error);
      throw error;
    }
  }
}
