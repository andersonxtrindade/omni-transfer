import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('signup')
  @ApiCreatedResponse({ description: 'User created successfully', schema: { example: { id: 'uuid' } } })
  async signup(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('auth')
  @Get()
  @ApiOkResponse({ description: 'User fetched successfully' })
  async getUsers() {
    return this.userService.getAll();
  }
}
