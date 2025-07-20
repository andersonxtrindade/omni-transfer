import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Users } from '../src/users/entities/users.entity'; 

export const testTypeOrmConfig: TypeOrmModuleOptions = {
  name: 'omni',
  type: 'sqlite',
  database: ':memory:',
  entities: [Users],
  synchronize: true, 
};
