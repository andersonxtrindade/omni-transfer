import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { CreateTransferDto } from "./dtos/create-transfer.dto";
import { TransfersService } from "./transfers.service";
import { PinoLogger } from 'nestjs-pino';

@Processor('transfer-queue')
export class TransfersProcessor {
  constructor(
    private readonly transfersService: TransfersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransfersProcessor.name);
  }

  @Process('transfer-job')
  async handleTransferJob(job: Job<CreateTransferDto>) {
    this.logger.info(`Starting the process of id ${job.id}`);
    job.log(`Starting the process of job ${job.id}`);

    const dto = job.data;

    try {
      await this.transfersService.processTransfer(dto);
      this.logger.info(`Job ${job.id} processed successfully`);
      job.log(`Job ${job.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}`, error);
      job.log(`Error processing job ${job.id}: ${error.message}`);
      throw error;
    }
  }
}
