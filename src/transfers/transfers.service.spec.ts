import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from 'src/transfers/transfers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transfers } from 'src/transfers/entities/transfers.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateTransferDto } from 'src/transfers/dtos/create-transfer.dto';
import { Users } from 'src/users/entities/users.entity';
import { PinoLogger } from 'nestjs-pino';

const mockTransferRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockUsersService = () => ({
  transferBalance: jest.fn(),
});

const mockLogger = () => ({
  setContext: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
});

describe('TransfersService', () => {
  let service: TransfersService;
  let transferRepository: jest.Mocked<Repository<Transfers>>;
  let usersService: jest.Mocked<UsersService>;
  let logger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        {
          provide: getRepositoryToken(Transfers, 'omni'),
          useValue: mockTransferRepository(),
        },
        {
          provide: UsersService,
          useValue: mockUsersService(),
        },
        {
          provide: PinoLogger,
          useValue: mockLogger(),
        },
      ],
    }).compile();

    service = module.get(TransfersService);
    transferRepository = module.get(getRepositoryToken(Transfers, 'omni'));
    usersService = module.get(UsersService);
    logger = module.get(PinoLogger);
  });

  describe('createTransfer', () => {
    it('should call usersService.transferBalance and save transfer', async () => {
      const dto: CreateTransferDto = {
        fromId: 'user-1',
        toId: 'user-2',
        amount: 100,
      };

      const senderMock: Users = { id: 'user-1' } as Users;
      const receiverMock: Users = { id: 'user-2' } as Users;

      const createdTransfer: Transfers = {
        id: 'transfer-id',
        sender: senderMock,
        receiver: receiverMock,
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      transferRepository.create.mockReturnValue(createdTransfer);
      transferRepository.save.mockResolvedValue(createdTransfer);

      await service.processTransfer(dto);

      expect(usersService.transferBalance).toHaveBeenCalledWith('user-1', 'user-2', 100);
      expect(transferRepository.create).toHaveBeenCalledWith({
        sender: { id: 'user-1' },
        receiver: { id: 'user-2' },
        amount: 100,
      });
      expect(transferRepository.save).toHaveBeenCalledWith(createdTransfer);
    });
  });

  it('should log and throw error when usersService.transferBalance fails', async () => {
    const dto: CreateTransferDto = {
      fromId: 'user-1',
      toId: 'user-2',
      amount: 100,
    };

    const error = new Error('Balance transfer failed');

    usersService.transferBalance.mockRejectedValueOnce(error);

    await expect(service.processTransfer(dto)).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith('Error occurred during transfer process', error);
  });

  it('should log and throw error when transferRepository.save fails', async () => {
    const dto: CreateTransferDto = {
      fromId: 'user-1',
      toId: 'user-2',
      amount: 100,
    };

    const createdTransfer: Transfers = {
      id: 'transfer-id',
      sender: { id: 'user-1' } as Users,
      receiver: { id: 'user-2' } as Users,
      amount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const error = new Error('Database save failed');

    transferRepository.create.mockReturnValue(createdTransfer);
    usersService.transferBalance.mockResolvedValue(undefined);
    transferRepository.save.mockRejectedValueOnce(error);

    await expect(service.processTransfer(dto)).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith('Error occurred during transfer process', error);
  });
});
