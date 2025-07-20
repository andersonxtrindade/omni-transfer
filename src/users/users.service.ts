import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users, 'omni')
    private readonly userRepository: Repository<Users>,
  ) { }

  async create(data: CreateUserDto): Promise<{ id: string }> {
    const existing = await this.userRepository.findOne({ where: { username: data.username } });
    if (existing) throw new ConflictException('Username already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      balance: 0,
    });

    const saved = await this.userRepository.save(user);
    return { id: saved.id };
  }

  async findByUsername(username: string): Promise<Users | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async transferBalance(fromId: string, toId: string, amount: number): Promise<void> {
    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({ where: { id: fromId } }),
      this.userRepository.findOne({ where: { id: toId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found');
    }

    if (sender.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    sender.balance = Number(sender.balance) - Number(amount);
    receiver.balance = Number(receiver.balance) + Number(amount);

    await this.userRepository.save([sender, receiver]);
  }

  async getAll() {
    return this.userRepository.find();
  }
}