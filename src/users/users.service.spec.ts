import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
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
          provide: getRepositoryToken(Users),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(Users));
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
  })
});
