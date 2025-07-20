import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { TokenResponseDto } from './dtos/token-response.dto';

@ApiTags('Auth')
@Controller('users')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signin')
    @HttpCode(200)
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({ type: TokenResponseDto })
    async login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }
}
