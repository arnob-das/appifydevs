import {
  Injectable,
  NotFoundException,
  Logger,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AiProvidersService } from '../ai-providers/ai-providers.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { ProviderAdapterFactory } from '../ai-providers/adapters/provider-adapter.factory.js';
import { decryptText } from '../../common/utils/crypto.util.js';
import { SendPromptDto } from './dto/send-prompt.dto.js';
import {
  CreateConversationDto,
  UpdateConversationDto,
} from './dto/create-conversation.dto.js';
import {
  ChatResponseDto,
  ChatMessageDto,
  ConversationDetailDto,
} from './dto/chat-response.dto.js';
import { MessageRole, ProviderType } from '../../common/constants/index.js';
import { ChatHistoryMessage } from '../ai-providers/adapters/ai-adapter.interface.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvidersService: AiProvidersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly adapterFactory: ProviderAdapterFactory,
  ) {}

  async sendPrompt(
    userId: string,
    dto: SendPromptDto,
  ): Promise<ChatResponseDto> {
    const { conversation, provider, model, systemPrompt } =
      await this.resolveContext(userId, dto);

    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: dto.prompt,
        tokensUsed: Math.ceil(dto.prompt.length / 4),
        modelUsed: model,
      },
    });

    const history = await this.loadConversationHistory(conversation.id);

    const decryptedKey = provider ? decryptText(provider.encryptedApiKey) : '';
    const adapter = this.adapterFactory.createAdapter(
      provider?.providerType || ProviderType.OPENAI,
      decryptedKey,
      provider?.baseUrl,
    );

    const startTime = Date.now();
    const aiResult = await adapter.sendMessage(
      dto.prompt,
      model,
      systemPrompt || undefined,
      history,
    );
    const latencyMs = Date.now() - startTime;

    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        content: aiResult.content,
        tokensUsed: aiResult.tokensUsed,
        modelUsed: model,
        metadata: {
          latencyMs,
          providerName: provider?.name || 'EchoGPT Default',
        },
      },
    });

    const totalTokens = userMessage.tokensUsed + assistantMessage.tokensUsed;
    await this.subscriptionsService.incrementUsage(userId, totalTokens);

    return {
      conversationId: conversation.id,
      userMessage: this.mapMessageToDto(userMessage),
      assistantMessage: this.mapMessageToDto(assistantMessage),
      model,
      providerName: provider?.name || 'EchoGPT Default',
      totalTokensUsed: totalTokens,
    };
  }

  streamPrompt(userId: string, dto: SendPromptDto): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      void (async () => {
        try {
          const { conversation, provider, model, systemPrompt } =
            await this.resolveContext(userId, dto);

          await this.prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: MessageRole.USER,
              content: dto.prompt,
              tokensUsed: Math.ceil(dto.prompt.length / 4),
              modelUsed: model,
            },
          });

          const history = await this.loadConversationHistory(conversation.id);
          const decryptedKey = provider
            ? decryptText(provider.encryptedApiKey)
            : '';
          const adapter = this.adapterFactory.createAdapter(
            provider?.providerType || ProviderType.OPENAI,
            decryptedKey,
            provider?.baseUrl,
          );

          let fullContent = '';
          let totalTokensUsed = 0;

          for await (const chunk of adapter.streamMessage(
            dto.prompt,
            model,
            systemPrompt || undefined,
            history,
          )) {
            fullContent += chunk.chunk;
            if (chunk.tokensUsed) {
              totalTokensUsed = chunk.tokensUsed;
            }

            observer.next({
              data: {
                conversationId: conversation.id,
                chunk: chunk.chunk,
                done: chunk.done,
                model,
                providerName: provider?.name || 'EchoGPT Default',
              },
            });
          }

          if (totalTokensUsed === 0) {
            totalTokensUsed = Math.ceil(
              (dto.prompt.length + fullContent.length) / 4,
            );
          }

          await this.prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: MessageRole.ASSISTANT,
              content: fullContent,
              tokensUsed: totalTokensUsed,
              modelUsed: model,
              metadata: {
                providerName: provider?.name || 'EchoGPT Default',
              },
            },
          });

          await this.subscriptionsService.incrementUsage(
            userId,
            totalTokensUsed,
          );

          observer.complete();
        } catch (error: any) {
          this.logger.error(`Stream error: ${error.message}`);
          observer.error(error);
        }
      })();
    });
  }

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationDetailDto> {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title || 'New Conversation',
        providerId: dto.providerId || null,
        model: dto.model || null,
        systemPrompt: dto.systemPrompt || null,
      },
      include: {
        messages: true,
      },
    });

    return this.mapConversationToDto(conversation);
  }

  async listConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      items: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        providerId: conv.providerId,
        model: conv.model,
        lastMessage: conv.messages[0]?.content || null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      meta: {
        totalItems: total,
        itemCount: conversations.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetailDto> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    return this.mapConversationToDto(conversation);
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ): Promise<ConversationDetailDto> {
    const existing = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.mapConversationToDto(updated);
  }

  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted successfully.' };
  }

  async clearMessages(
    userId: string,
    conversationId: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    await this.prisma.chatMessage.deleteMany({
      where: { conversationId },
    });

    return { message: 'Conversation messages cleared.' };
  }

  private async resolveContext(userId: string, dto: SendPromptDto) {
    let conversation;

    if (dto.conversationId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, userId },
      });
      if (!conversation) {
        throw new NotFoundException(
          `Conversation #${dto.conversationId} not found`,
        );
      }
    } else {
      const title =
        dto.prompt.slice(0, 40) + (dto.prompt.length > 40 ? '...' : '');
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          title,
          providerId: dto.providerId || null,
          model: dto.model || null,
          systemPrompt: dto.systemPrompt || null,
        },
      });
    }

    let provider = null;
    const providerId = dto.providerId || conversation.providerId;

    if (providerId) {
      provider = await this.prisma.aiProvider.findUnique({
        where: { id: providerId },
      });
    }

    if (!provider) {
      provider = await this.aiProvidersService.getDefaultProvider();
    }

    const model =
      dto.model || conversation.model || provider?.defaultModel || 'gpt-4o';

    const systemPrompt = dto.systemPrompt || conversation.systemPrompt || null;

    return { conversation, provider, model, systemPrompt };
  }

  private async loadConversationHistory(
    conversationId: string,
  ): Promise<ChatHistoryMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return messages.reverse().map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  private mapMessageToDto(msg: any): ChatMessageDto {
    return {
      id: msg.id,
      role: msg.role as MessageRole,
      content: msg.content,
      tokensUsed: msg.tokensUsed,
      modelUsed: msg.modelUsed,
      metadata: msg.metadata,
      createdAt: msg.createdAt,
    };
  }

  private mapConversationToDto(conv: any): ConversationDetailDto {
    return {
      id: conv.id,
      title: conv.title,
      providerId: conv.providerId,
      model: conv.model,
      systemPrompt: conv.systemPrompt,
      messages: (conv.messages || []).map((m: any) => this.mapMessageToDto(m)),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }
}
