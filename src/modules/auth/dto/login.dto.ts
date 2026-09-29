import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'alex.developer@example.com',
    description: 'Registered email address',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password@1234',
    description: 'User account password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
