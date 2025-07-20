import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import { CreateTransferDto } from "./dtos/create-transfer.dto";

@Injectable()
export class TransfersProducer {
  constructor(
    @InjectQueue('transfer-queue')
    private readonly transferQueue: Queue,
  ) {}

  async enqueueTransfer(dto: CreateTransferDto): Promise<void> {
    await this.transferQueue.add('transfer-job', dto, {
      attempts: 3,
      backoff: 2000,
      removeOnComplete: true,
    });
  }
}
