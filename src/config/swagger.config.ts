import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('EchoGPT Backend REST API')
    .setDescription(
      `## EchoGPT Multi-AI Chrome Extension Backend API
      
Production-ready backend API for EchoGPT Chrome Extension built with NestJS, PostgreSQL, Prisma ORM, and Swagger OpenAPI.

### Key Capabilities:
- **Authentication**: JWT access & refresh token rotation, bcrypt hashing, session tracking, email verification.
- **User Management**: Profile updates, password changes, account deletion, RBAC (USER / ADMIN).
- **Subscription Management**: Free, Premium, Enterprise tiers with usage limits and remaining quota tracking.
- **AI Provider Management**: Multi-provider support (OpenAI, Anthropic Claude, Google Gemini) with AES-256 encrypted API key storage.
- **Chat API**: Standard AI prompt completion, multi-turn conversation history, and Server-Sent Events (SSE) streaming responses.
- **Web Search API**: AI-assisted web search with search history, autocomplete suggestions, and cache acceleration.
- **Admin Panel APIs**: Platform stats, user management, subscription management, usage analytics, audit logs, and system health checks.
`,
    )
    .setVersion('1.0.0')
    .setContact(
      'EchoGPT Engineering Team',
      'https://chromewebstore.google.com/detail/echogpt-multi-ai-chat-sid/negimdcamohmoheiifgecbjgjepkcfhj',
      'dev@echogpt.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token (e.g. Bearer eyJhbG...)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag(
      'Authentication',
      'User registration, login, token refresh, logout, email verification',
    )
    .addTag(
      'Users',
      'User profile management, password updates, account deletion',
    )
    .addTag(
      'Subscriptions',
      'Plan tiers, subscription status, usage tracking, upgrades/downgrades',
    )
    .addTag(
      'AI Providers',
      'Multi-AI provider configuration, models, secure credentials, health checks',
    )
    .addTag(
      'Chat',
      'AI prompt completions, conversation threads, SSE response streaming',
    )
    .addTag(
      'Web Search',
      'AI-assisted search query, history, suggestions, and cached search',
    )
    .addTag(
      'Admin',
      'Dashboard analytics, user & subscription admin, audit logs, system health',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
    },
    customSiteTitle: 'EchoGPT REST API Documentation',
  });
}
