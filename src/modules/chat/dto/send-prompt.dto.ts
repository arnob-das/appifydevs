import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendPromptDto {
  @ApiProperty({
    example: 'Explain TypeScript generics with an example.',
    description: 'The user prompt or query to send to the AI model',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'Optional existing conversation UUID. If omitted, a new conversation thread will be started.',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'Target AI Provider UUID (OpenAI, Claude, Gemini). If omitted, default provider is used.',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({
    example: 'gpt-4o',
    description:
      'Specific model identifier. If omitted, provider default model is used.',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    example: 'You are an expert senior software engineer.',
    description:
      'Optional custom system prompt to condition the model response',
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}
