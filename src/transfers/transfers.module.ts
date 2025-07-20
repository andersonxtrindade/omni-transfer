import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transfers } from './entities/transfers.entity';
import { UsersModule } from 'src/users/users.module';
import { BullModule } from '@nestjs/bull';
import { TransfersProducer } from './transfer.producer';
import { TransfersProcessor } from './transfers.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transfer-queue',
    }),
    TypeOrmModule.forFeature([Transfers], 'omni'),
    UsersModule,
  ],
  controllers: [TransfersController],
  providers: [
    TransfersService,
    TransfersProducer,
    TransfersProcessor,
  ]
})
export class TransfersModule {}
