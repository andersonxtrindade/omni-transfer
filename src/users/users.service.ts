import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users, 'omni')
    private readonly userRepository: Repository<Users>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async create(data: CreateUserDto): Promise<{ id: string }> {
    try {
      const existing = await this.userRepository.findOne({
        where: { username: data.username },
      });
      if (existing) {
        this.logger.warn(`Attempt to create duplicate username: ${data.username}`);
        throw new ConflictException('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = this.userRepository.create({
        ...data,
        password: hashedPassword,
        balance: 0,
      });

      const saved = await this.userRepository.save(user);
      this.logger.info(`User created with id: ${saved.id}`);

      return { id: saved.id };
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<Users | null> {
    try {
      const user = await this.userRepository.findOne({ where: { username } });
      if (!user) {
        this.logger.warn(`User not found by username: ${username}`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by username: ${username}`, error);
      throw error;
    }
  }

  async transferBalance(fromId: string, toId: string, amount: number): Promise<void> {
    try {
      const [sender, receiver] = await Promise.all([
        this.userRepository.findOne({ where: { id: fromId } }),
        this.userRepository.findOne({ where: { id: toId } }),
      ]);

      if (!sender || !receiver) {
        this.logger.warn(
          `Transfer failed: sender or receiver not found (fromId: ${fromId}, toId: ${toId})`,
        );
        throw new NotFoundException('Sender or receiver not found');
      }

      if (sender.balance < amount) {
        this.logger.warn(
          `Transfer failed: insufficient balance (senderId: ${fromId}, balance: ${sender.balance}, amount: ${amount})`,
        );
        throw new BadRequestException('Insufficient balance');
      }

      sender.balance = Number(sender.balance) - Number(amount);
      receiver.balance = Number(receiver.balance) + Number(amount);

      await this.userRepository.save([sender, receiver]);
      this.logger.info(`Transfer successful from ${fromId} to ${toId} amount ${amount}`);
    } catch (error) {
      this.logger.error(
        `Error during balance transfer from ${fromId} to ${toId} amount ${amount}`,
        error,
      );
      throw error;
    }
  }

  async getAll() {
    try {
      const users = await this.userRepository.find();
      this.logger.info(`Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error('Failed to get all users', error);
      throw error;
    }
  }
}
