import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data if credentials are valid', async () => {
      const user = { id: 1, username: 'john', password: await bcrypt.hash('123456', 10) };
      (usersService.findByUsername as jest.Mock).mockResolvedValue(user);

      const result = await authService.validateUser({ username: 'john', password: '123456' });

      expect(result).toEqual({ id: 1, username: 'john' });
    });

    it('should return null if credentials are invalid', async () => {
      const user = { id: 1, username: 'john', password: await bcrypt.hash('123456', 10) };
      (usersService.findByUsername as jest.Mock).mockResolvedValue(user);

      const result = await authService.validateUser({ username: 'john', password: 'wrongpass' });

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token and expiration if credentials are valid', async () => {
      const user = { id: 1, username: 'john', password: await bcrypt.hash('123456', 10) };
      (usersService.findByUsername as jest.Mock).mockResolvedValue(user);
      (jwtService.sign as jest.Mock).mockReturnValue('mocked-token');

      const result = await authService.login({ username: 'john', password: '123456' });

      expect(result).toEqual({
        access_token: 'mocked-token',
        expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      (usersService.findByUsername as jest.Mock).mockResolvedValue(null);

      await expect(authService.login({ username: 'john', password: 'wrongpass' }))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
});
