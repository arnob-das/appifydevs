import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0',
    description: 'Email verification token sent to user',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    example: 'alex.developer@example.com',
    description: 'User email to resend verification link',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
