import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transfers } from './entities/transfers.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transfers], 'omni'),
    UsersModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService]
})
export class TransfersModule {}
