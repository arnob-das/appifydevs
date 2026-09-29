import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({
    example: 'TypeScript Generics Discussion',
    description: 'Title for the conversation thread',
    default: 'New Conversation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'AI Provider UUID for this conversation',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({
    example: 'gpt-4o',
    description: 'AI model to pin to this conversation',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    example: 'You are a helpful coding assistant.',
    description: 'System prompt to apply across all turns in this conversation',
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({
    example: 'Updated Conversation Title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}
