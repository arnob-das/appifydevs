import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType } from '../../../common/constants/index.js';

export class ProviderResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'OpenAI Official' })
  name: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.OPENAI })
  providerType: ProviderType;

  @ApiPropertyOptional({ example: 'https://api.openai.com/v1', nullable: true })
  baseUrl: string | null;

  @ApiProperty({
    example: 'sk-p...1234',
    description: 'Masked API key for security verification',
  })
  maskedApiKey: string;

  @ApiProperty({ example: 'gpt-4o' })
  defaultModel: string;

  @ApiProperty({ example: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] })
  availableModels: string[];

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: 10 })
  priority: number;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  updatedAt: Date;
}

export class ProviderHealthDto {
  @ApiProperty({ example: 'OpenAI' })
  providerName: string;

  @ApiProperty({
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy'],
  })
  status: string;

  @ApiProperty({ example: 45 })
  latencyMs: number;

  @ApiPropertyOptional({ example: 'OpenAI API responsive' })
  message?: string;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  checkedAt: string;
}
