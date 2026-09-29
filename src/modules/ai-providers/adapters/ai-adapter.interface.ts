export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiResponse {
  content: string;
  tokensUsed: number;
  model: string;
  provider: string;
}

export interface AiStreamChunk {
  chunk: string;
  done: boolean;
  tokensUsed?: number;
  model?: string;
}

export interface ProviderHealthResult {
  providerName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  message?: string;
  checkedAt: string;
}

export interface IAiAdapter {
  sendMessage(
    prompt: string,
    model: string,
    systemPrompt?: string,
    history?: ChatHistoryMessage[],
  ): Promise<AiResponse>;

  streamMessage(
    prompt: string,
    model: string,
    systemPrompt?: string,
    history?: ChatHistoryMessage[],
  ): AsyncIterable<AiStreamChunk>;

  checkHealth(): Promise<ProviderHealthResult>;
}
