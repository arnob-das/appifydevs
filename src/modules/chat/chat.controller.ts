import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service.js';
import { SendPromptDto } from './dto/send-prompt.dto.js';
import {
  CreateConversationDto,
  UpdateConversationDto,
} from './dto/create-conversation.dto.js';
import {
  ChatResponseDto,
  ConversationDetailDto,
} from './dto/chat-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UsageLimitGuard } from '../../common/guards/usage-limit.guard.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(UsageLimitGuard)
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send prompt and receive AI response',
    description:
      'Sends a prompt to the specified or default AI provider (OpenAI, Claude, Gemini) and stores conversation history.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI response generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Daily usage quota exceeded for subscription plan',
  })
  async sendPrompt(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendPromptDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.sendPrompt(user.userId, dto);
  }

  @UseGuards(UsageLimitGuard)
  @Sse('stream')
  @ApiOperation({
    summary:
      'Stream AI response in real time via Server-Sent Events (SSE) (Bonus)',
    description:
      'Streams token chunks as they arrive from the AI provider. Client listens to text/event-stream.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream established',
  })
  streamPrompt(
    @CurrentUser() user: CurrentUserPayload,
    @Query('prompt') prompt: string,
    @Query('conversationId') conversationId?: string,
    @Query('providerId') providerId?: string,
    @Query('model') model?: string,
    @Query('systemPrompt') systemPrompt?: string,
  ): Observable<MessageEvent> {
    const dto: SendPromptDto = {
      prompt,
      conversationId,
      providerId,
      model,
      systemPrompt,
    };
    return this.chatService.streamPrompt(user.userId, dto);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new conversation thread',
    description:
      'Initializes a new conversation with optional title, provider, and model configuration.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Conversation created',
    type: ConversationDetailDto,
  })
  async createConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationDetailDto> {
    return this.chatService.createConversation(user.userId, dto);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'List user conversations',
    description:
      'Returns paginated list of conversations with the last message snippet.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved',
  })
  async listConversations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.chatService.listConversations(
      user.userId,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get conversation thread and full message history',
    description:
      'Retrieves all user and assistant messages for a conversation.',
  })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation details retrieved',
    type: ConversationDetailDto,
  })
  async getConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<ConversationDetailDto> {
    return this.chatService.getConversation(user.userId, id);
  }

  @Patch('conversations/:id')
  @ApiOperation({
    summary: 'Update conversation title',
    description: 'Renames a conversation thread.',
  })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation updated',
    type: ConversationDetailDto,
  })
  async updateConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ConversationDetailDto> {
    return this.chatService.updateConversation(user.userId, id, dto);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete conversation thread',
    description:
      'Permanently deletes a conversation and all associated chat messages.',
  })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation deleted',
  })
  async deleteConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.chatService.deleteConversation(user.userId, id);
  }

  @Delete('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear message history of a conversation',
    description: 'Removes all messages while preserving the thread settings.',
  })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages cleared',
  })
  async clearMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.chatService.clearMessages(user.userId, id);
  }
}
