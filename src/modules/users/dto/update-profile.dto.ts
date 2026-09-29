import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Alex Developer',
    description: 'Updated display name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://images.example.com/avatars/alex.png',
    description: 'URL to avatar image',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid HTTP/HTTPS URL' })
  avatarUrl?: string;
}
