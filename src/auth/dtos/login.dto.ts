import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty({ example: 'andersonxtrindade' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'StrongPassword123' })
    @IsString()
    @MinLength(6)
    password: string;
}