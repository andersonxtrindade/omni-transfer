import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfers } from './entities/transfers.entity';
import { Repository } from 'typeorm';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { UsersService } from 'src/users/users.service';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class TransfersService {
    constructor(
        @InjectRepository(Transfers, 'omni')
        private readonly transferRepository: Repository<Transfers>,
        private readonly usersService: UsersService,
    ) { }

    async processTransfer(dto: CreateTransferDto): Promise<void> {
        await this.usersService.transferBalance(dto.fromId, dto.toId, dto.amount);

        const transfer = this.transferRepository.create({
            sender: { id: dto.fromId } as Users,
            receiver: { id: dto.toId } as Users,
            amount: dto.amount,
        });

        await this.transferRepository.save(transfer);
    }
}
