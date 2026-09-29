import { describe, it, expect } from 'vitest';
import { OpenAiAdapter } from '../src/modules/ai-providers/adapters/openai.adapter.js';
import { ClaudeAdapter } from '../src/modules/ai-providers/adapters/claude.adapter.js';
import { GeminiAdapter } from '../src/modules/ai-providers/adapters/gemini.adapter.js';
import { ProviderAdapterFactory } from '../src/modules/ai-providers/adapters/provider-adapter.factory.js';
import { ProviderType } from '../src/common/constants/index.js';

describe('AI Provider Adapters & Multi-Model Engine', () => {
  const factory = new ProviderAdapterFactory();

  describe('ProviderAdapterFactory', () => {
    it('should instantiate OpenAiAdapter for ProviderType.OPENAI', () => {
      const adapter = factory.createAdapter(ProviderType.OPENAI, 'dummy-key');
      expect(adapter).toBeInstanceOf(OpenAiAdapter);
    });

    it('should instantiate ClaudeAdapter for ProviderType.CLAUDE', () => {
      const adapter = factory.createAdapter(ProviderType.CLAUDE, 'dummy-key');
      expect(adapter).toBeInstanceOf(ClaudeAdapter);
    });

    it('should instantiate GeminiAdapter for ProviderType.GEMINI', () => {
      const adapter = factory.createAdapter(ProviderType.GEMINI, 'dummy-key');
      expect(adapter).toBeInstanceOf(GeminiAdapter);
    });
  });

  describe('OpenAiAdapter', () => {
    const adapter = new OpenAiAdapter('mock-key');

    it('should generate completion response with token count', async () => {
      const res = await adapter.sendMessage('Explain recursion', 'gpt-4o');
      expect(res.content).toBeDefined();
      expect(res.tokensUsed).toBeGreaterThan(0);
      expect(res.model).toBe('gpt-4o');
      expect(res.provider).toBe('OpenAI');
    });

    it('should stream message chunks', async () => {
      const chunks: string[] = [];
      let lastDone = false;

      for await (const chunk of adapter.streamMessage(
        'Hello world',
        'gpt-4o',
      )) {
        chunks.push(chunk.chunk);
        if (chunk.done) {
          lastDone = true;
          expect(chunk.tokensUsed).toBeDefined();
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(lastDone).toBe(true);
    });

    it('should return health check status', async () => {
      const health = await adapter.checkHealth();
      expect(health.providerName).toBe('OpenAI');
      expect(['healthy', 'degraded']).toContain(health.status);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ClaudeAdapter', () => {
    const adapter = new ClaudeAdapter('mock-key');

    it('should generate completion response', async () => {
      const res = await adapter.sendMessage(
        'Write a quick sort algorithm',
        'claude-3-5-sonnet',
      );
      expect(res.content).toBeDefined();
      expect(res.model).toBe('claude-3-5-sonnet');
      expect(res.provider).toBe('Claude (Anthropic)');
    });

    it('should stream chunks for Claude', async () => {
      const chunks = [];
      for await (const chunk of adapter.streamMessage(
        'Test prompt',
        'claude-3-5-sonnet',
      )) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].done).toBe(true);
    });
  });

  describe('GeminiAdapter', () => {
    const adapter = new GeminiAdapter('mock-key');

    it('should generate response for Gemini model', async () => {
      const res = await adapter.sendMessage(
        'What is quantum computing?',
        'gemini-1.5-pro',
      );
      expect(res.content).toBeDefined();
      expect(res.model).toBe('gemini-1.5-pro');
      expect(res.provider).toBe('Google Gemini');
    });
  });
});
