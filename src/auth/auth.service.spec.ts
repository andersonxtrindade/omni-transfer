import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';

const mockUser = { id: 1, username: 'john', password: '' };

const mockUsersService = () => ({
  findByUsername: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

const mockLogger = () => ({
  setContext: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
});

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: PinoLogger, useFactory: mockLogger },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data if credentials are valid', async () => {
      const password = await bcrypt.hash('123456', 10);
      usersService.findByUsername.mockResolvedValue({ ...mockUser, password });

      const result = await authService.validateUser({ username: 'john', password: '123456' });

      expect(result).toEqual({ id: 1, username: 'john' });
    });

    it('should return null if credentials are invalid', async () => {
      const password = await bcrypt.hash('123456', 10);
      usersService.findByUsername.mockResolvedValue({ ...mockUser, password });

      const result = await authService.validateUser({ username: 'john', password: 'wrong' });

      expect(result).toBeNull();
    });

    it('should rethrow if findByUsername throws', async () => {
      usersService.findByUsername.mockRejectedValue(new Error('DB error'));

      await expect(authService.validateUser({ username: 'john', password: '123' }))
        .rejects.toThrow('DB error');
    });
  });

  describe('login', () => {
    it('should return token and expiration if credentials are valid', async () => {
      const password = await bcrypt.hash('123456', 10);
      usersService.findByUsername.mockResolvedValue({ ...mockUser, password });
      jwtService.sign.mockReturnValue('mocked-token');

      const result = await authService.login({ username: 'john', password: '123456' });

      expect(result).toEqual({
        access_token: 'mocked-token',
        expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(authService.login({ username: 'john', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should rethrow if validateUser throws', async () => {
      jest.spyOn(authService, 'validateUser').mockRejectedValueOnce(new Error('Boom!'));

      await expect(authService.login({ username: 'john', password: '123' }))
        .rejects.toThrow('Boom!');
    });
  });
});
