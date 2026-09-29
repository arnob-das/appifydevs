import { Injectable } from '@nestjs/common';
import { ProviderType } from '../../../common/constants/index.js';
import { IAiAdapter } from './ai-adapter.interface.js';
import { OpenAiAdapter } from './openai.adapter.js';
import { ClaudeAdapter } from './claude.adapter.js';
import { GeminiAdapter } from './gemini.adapter.js';

@Injectable()
export class ProviderAdapterFactory {
  createAdapter(
    type: ProviderType | string,
    apiKey: string,
    baseUrl?: string | null,
  ): IAiAdapter {
    switch (type) {
      case ProviderType.OPENAI:
        return new OpenAiAdapter(apiKey, baseUrl || undefined);
      case ProviderType.CLAUDE:
        return new ClaudeAdapter(apiKey, baseUrl || undefined);
      case ProviderType.GEMINI:
        return new GeminiAdapter(apiKey, baseUrl || undefined);
      default:
        return new OpenAiAdapter(apiKey, baseUrl || undefined);
    }
  }
}
