import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { CreateTransferDto } from "./dtos/create-transfer.dto";
import { TransfersService } from "./transfers.service";

@Processor('transfer-queue')
export class TransfersProcessor {
  constructor(private readonly transfersService: TransfersService) {}

  @Process('transfer-job')
  async handleTransferJob(job: Job<CreateTransferDto>) {
    const dto = job.data;

    try {
      await this.transfersService.processTransfer(dto);
    } catch (error) {
      console.error('Error processing transfer:', error);
      throw error; 
    }
  }
}
