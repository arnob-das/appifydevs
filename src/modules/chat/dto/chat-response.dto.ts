import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../../../common/constants/index.js';

export class ChatMessageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ enum: MessageRole, example: MessageRole.USER })
  role: MessageRole;

  @ApiProperty({ example: 'Explain TypeScript generics with an example.' })
  content: string;

  @ApiProperty({ example: 45 })
  tokensUsed: number;

  @ApiPropertyOptional({ example: 'gpt-4o' })
  modelUsed?: string;

  @ApiPropertyOptional({ example: { latencyMs: 250 } })
  metadata?: any;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt: Date;
}

export class ChatResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  conversationId: string;

  @ApiProperty({ type: ChatMessageDto })
  userMessage: ChatMessageDto;

  @ApiProperty({ type: ChatMessageDto })
  assistantMessage: ChatMessageDto;

  @ApiProperty({ example: 'gpt-4o' })
  model: string;

  @ApiProperty({ example: 'OpenAI Official' })
  providerName: string;

  @ApiProperty({ example: 120 })
  totalTokensUsed: number;
}

export class ConversationDetailDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'TypeScript Generics Discussion' })
  title: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  providerId: string | null;

  @ApiPropertyOptional({ example: 'gpt-4o' })
  model: string | null;

  @ApiPropertyOptional({ example: 'You are a helpful coding assistant.' })
  systemPrompt: string | null;

  @ApiProperty({ type: [ChatMessageDto] })
  messages: ChatMessageDto[];

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  updatedAt: Date;
}
