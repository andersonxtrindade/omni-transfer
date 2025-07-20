import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TransfersModule } from './transfers/transfers.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      name: 'omni',
      useFactory: (): TypeOrmModuleOptions => {
        if (process.env.NODE_ENV === 'test') {
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
          };
        }

        return {
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          migrationsRun: false,
          ssl: true,
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };
      }
    }), BullModule.forRoot({
      redis: process.env.REDIS_URL
        ? {
          host: new URL(process.env.REDIS_URL).hostname,
          port: Number(new URL(process.env.REDIS_URL).port),
          username: 'default',
          password: new URL(process.env.REDIS_URL).password,
          tls: {},
        }
        : {
          host: 'localhost',
          port: 6379,
        },
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    TransfersModule,
  ],
})
export class AppModule { }
