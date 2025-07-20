import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<Users>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users, 'omni'),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(Users, 'omni'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as any);
      repository.save.mockResolvedValue({
        id: 'uuid',
        username: 'john',
        password: 'hashed-password',
        birthdate: '2000-01-01',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto = {
        username: 'john',
        password: '123456',
        birthdate: '2000-01-01',
      };

      const result = await service.create(dto);
      expect(result).toEqual({ id: 'uuid' });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw if username already exists', async () => {
      repository.findOne.mockResolvedValue({ id: '1' } as any);

      await expect(
        service.create({
          username: 'john',
          password: '123456',
          birthdate: '2000-01-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password before saving', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash');
      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as any);
      repository.save.mockResolvedValue({ id: 'uuid' } as any);

      await service.create({
        username: 'test',
        password: 'abc123',
        birthdate: '1990-01-01',
      });

      expect(hashSpy).toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 'uuid',
        username: 'john',
        password: 'hashed-password',
        birthdate: '2000-01-01',
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('john');

      expect(result).toEqual(user);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'john' },
      });
    });

    it('should return null if user is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
    });
  })

  describe('transferBalance', () => {
    const sender = {
      id: 'user1',
      balance: 100,
    } as Users;

    const receiver = {
      id: 'user2',
      balance: 50,
    } as Users;

    it('should transfer balance successfully', async () => {
      repository.findOne
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(receiver);

      (repository.save as jest.Mock).mockResolvedValue([sender, receiver]);


      await service.transferBalance('user1', 'user2', 40);

      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(sender.balance).toBe(60);
      expect(receiver.balance).toBe(90);
      expect(repository.save).toHaveBeenCalledWith([sender, receiver]);
    });

    it('should throw NotFoundException if sender or receiver is not found', async () => {
      repository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(receiver);

      await expect(service.transferBalance('invalid', 'user2', 10)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sender has insufficient balance', async () => {
      const lowBalanceSender = { ...sender, balance: 10 };

      repository.findOne
        .mockResolvedValueOnce(lowBalanceSender)
        .mockResolvedValueOnce(receiver);

      await expect(service.transferBalance('user1', 'user2', 50)).rejects.toThrow(BadRequestException);
    });
  });
});
