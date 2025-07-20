import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) {}

    async validateUser(loginDto: LoginDto): Promise<any> {
        const { username, password } = loginDto;
        const user = await this.usersService.findByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, username: user.username };
        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            expiresIn: process.env.JWT_EXPIRES_IN || '3600s'
        }
    }
}
