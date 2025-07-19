import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { TokenResponseDto } from './dtos/token-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({ type: TokenResponseDto })
    async login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }
}
