import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    try {
      const { username, password } = loginDto;
      const user = await this.usersService.findByUsername(username);
      if (user && await bcrypt.compare(password, user.password)) {
        const { password, ...result } = user;
        this.logger.info(`User ${username} successfully validated`);
        return result;
      }

      this.logger.warn(`Invalid credentials for user ${username}`);
      return null;
    } catch (error) {
      this.logger.error(`Error validating user ${loginDto.username}: ${error.message}`);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto);
      if (!user) {
        this.logger.warn(`Unauthorized login attempt for ${loginDto.username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user.id, username: user.username };
      const access_token = this.jwtService.sign(payload);
      this.logger.info(`User ${user.username} logged in successfully`);

      return {
        access_token,
        expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
      };
    } catch (error) {
      this.logger.error(`Login error for ${loginDto.username}: ${error.message}`);
      throw error;
    }
  }
}
