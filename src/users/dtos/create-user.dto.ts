import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateApproverDto {

  @ApiProperty({
    description: 'Email of the approver',
    example: 'test@email.com',
  })
  @IsString()
  email: string;
}