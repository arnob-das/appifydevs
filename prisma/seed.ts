import {
  PrismaClient,
  Role,
  PlanTier,
  SubscriptionStatus,
  ProviderType,
  MessageRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function encryptText(text: string, secretKeyHex?: string): string {
  if (!text) return '';
  const keyHex =
    secretKeyHex ||
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const key = Buffer.from(keyHex.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
  console.log(' Starting EchoGPT database seeding...');

  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@echogpt.dev' },
    update: {},
    create: {
      email: 'admin@echogpt.dev',
      name: 'EchoGPT Administrator',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      subscription: {
        create: {
          planTier: PlanTier.ENTERPRISE,
          status: SubscriptionStatus.ACTIVE,
          requestsLimitDaily: 5000,
          tokensLimitMonthly: 20000000,
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { subscription: true },
  });
  console.log(` Admin user seeded: ${admin.email}`);

  const userPasswordHash = await bcrypt.hash('User@123456', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@echogpt.dev' },
    update: {},
    create: {
      email: 'user@echogpt.dev',
      name: 'Alex Developer',
      passwordHash: userPasswordHash,
      role: Role.USER,
      isEmailVerified: true,
      subscription: {
        create: {
          planTier: PlanTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          requestsLimitDaily: 20,
          tokensLimitMonthly: 100000,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { subscription: true },
  });
  console.log(` Regular user seeded: ${regularUser.email}`);

  const openai = await prisma.aiProvider.upsert({
    where: { name: 'OpenAI Official' },
    update: {},
    create: {
      name: 'OpenAI Official',
      providerType: ProviderType.OPENAI,
      baseUrl: 'https://api.openai.com/v1',
      encryptedApiKey: encryptText('sk-demo-openai-key-echogpt-2026'),
      defaultModel: 'gpt-4o',
      availableModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      isEnabled: true,
      isDefault: true,
      priority: 100,
    },
  });

  const claude = await prisma.aiProvider.upsert({
    where: { name: 'Anthropic Claude' },
    update: {},
    create: {
      name: 'Anthropic Claude',
      providerType: ProviderType.CLAUDE,
      baseUrl: 'https://api.anthropic.com/v1',
      encryptedApiKey: encryptText('sk-ant-demo-claude-key-echogpt-2026'),
      defaultModel: 'claude-3-5-sonnet',
      availableModels: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
      isEnabled: true,
      isDefault: false,
      priority: 90,
    },
  });

  const gemini = await prisma.aiProvider.upsert({
    where: { name: 'Google Gemini' },
    update: {},
    create: {
      name: 'Google Gemini',
      providerType: ProviderType.GEMINI,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      encryptedApiKey: encryptText('demo-gemini-api-key-echogpt-2026'),
      defaultModel: 'gemini-1.5-pro',
      availableModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      isEnabled: true,
      isDefault: false,
      priority: 80,
    },
  });

  console.log(
    ` AI Providers seeded: OpenAI (${openai.id}), Claude (${claude.id}), Gemini (${gemini.id})`,
  );

  const conversation = await prisma.conversation.create({
    data: {
      userId: regularUser.id,
      title: 'Getting started with NestJS and Prisma',
      providerId: openai.id,
      model: 'gpt-4o',
      systemPrompt:
        'You are an expert developer assistant for the EchoGPT Chrome Extension.',
      messages: {
        create: [
          {
            role: MessageRole.USER,
            content:
              'How do I structure a clean architecture backend in NestJS?',
            tokensUsed: 15,
            modelUsed: 'gpt-4o',
          },
          {
            role: MessageRole.ASSISTANT,
            content:
              'A clean architecture in NestJS separates domain business logic from framework infrastructure. Key layers include Controllers (HTTP/REST interface), Services (business logic and orchestration), Repositories/Prisma (database persistence), and DTOs (validation & contracts).',
            tokensUsed: 42,
            modelUsed: 'gpt-4o',
            metadata: { latencyMs: 180, providerName: 'OpenAI Official' },
          },
        ],
      },
    },
  });
  console.log(` Sample conversation seeded: #${conversation.id}`);

  const query = 'nestjs clean architecture best practices';
  const queryHash = crypto
    .createHash('sha256')
    .update(query.toLowerCase())
    .digest('hex');

  const sampleResults = [
    {
      title: 'NestJS Architecture and Best Practices Guide',
      url: 'https://docs.nestjs.com/first-steps',
      snippet:
        'Comprehensive architectural patterns in NestJS, utilizing dependency injection, modular organization, and robust controller/service separation.',
      domain: 'docs.nestjs.com',
    },
  ];

  await prisma.searchCache.upsert({
    where: { queryHash },
    update: {},
    create: {
      queryHash,
      query,
      results: sampleResults as any,
      summary:
        'NestJS best practices emphasize modularity, clean architecture, dependency injection, and centralized error handling.',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.webSearch.create({
    data: {
      userId: regularUser.id,
      query,
      results: sampleResults as any,
      summary:
        'NestJS best practices emphasize modularity, clean architecture, dependency injection, and centralized error handling.',
    },
  });

  console.log(' Sample search & cache seeded');
  console.log(' EchoGPT database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
