import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { ProviderType } from '../../../common/constants/index.js';

export class CreateProviderDto {
  @ApiProperty({
    example: 'OpenAI Official',
    description: 'Unique display name for the provider',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: ProviderType,
    example: ProviderType.OPENAI,
    description: 'Provider classification (OPENAI, CLAUDE, GEMINI, CUSTOM)',
  })
  @IsEnum(ProviderType)
  @IsNotEmpty()
  providerType: ProviderType;

  @ApiPropertyOptional({
    example: 'https://api.openai.com/v1',
    description: 'Custom base URL if using an enterprise or proxy endpoint',
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({
    example: 'sk-proj-abc123...',
    description:
      'API Key for the provider (stored securely using AES-256-GCM encryption)',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({
    example: 'gpt-4o',
    description: 'Default model identifier to use with this provider',
  })
  @IsString()
  @IsNotEmpty()
  defaultModel: string;

  @ApiPropertyOptional({
    example: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    description: 'Array of supported model IDs for this provider',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableModels?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this provider is currently enabled',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this provider is the system-wide default',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Priority ordering (higher number = higher priority)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
