import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'alex.developer@example.com',
    description: 'Unique email address of the user',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password@1234',
    description:
      'Password must be at least 8 characters long and contain letters, numbers, and symbols',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'Arnob Developer',
    description: 'Display name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
