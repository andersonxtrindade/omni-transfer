import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { ApiCreatedResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('signup')
  @ApiCreatedResponse({ description: 'User created successfully', schema: { example: { id: 'uuid' } } })
  async signup(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }
}
