import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from 'src/transfers/transfers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transfers } from 'src/transfers/entities/transfers.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateTransferDto } from 'src/transfers/dtos/create-transfer.dto';
import { Users } from 'src/users/entities/users.entity';

const mockTransferRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockUsersService = () => ({
  transferBalance: jest.fn(),
});

describe('TransfersService', () => {
  let service: TransfersService;
  let transferRepository: jest.Mocked<Repository<Transfers>>;
  let usersService: jest.Mocked<UsersService>;

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
      ],
    }).compile();

    service = module.get(TransfersService);
    transferRepository = module.get(getRepositoryToken(Transfers, 'omni'));
    usersService = module.get(UsersService);
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
});
