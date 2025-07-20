import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Users } from '../src/users/entities/users.entity'; 
import { Transfers } from 'src/transfers/entities/transfers.entity';

export const testTypeOrmConfig: TypeOrmModuleOptions = {
  name: 'omni',
  type: 'sqlite',
  database: ':memory:',
  entities: [Users, Transfers],
  synchronize: true, 
};
