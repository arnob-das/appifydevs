CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

CREATE TYPE "ProviderType" AS ENUM ('OPENAI', 'CLAUDE', 'GEMINI', 'CUSTOM');

CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpires" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "requestsUsedToday" INTEGER NOT NULL DEFAULT 0,
    "requestsLimitDaily" INTEGER NOT NULL DEFAULT 20,
    "tokensUsedCurrentMonth" INTEGER NOT NULL DEFAULT 0,
    "tokensLimitMonthly" INTEGER NOT NULL DEFAULT 100000,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiProvider" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "baseUrl" TEXT,
    "encryptedApiKey" TEXT NOT NULL,
    "defaultModel" TEXT NOT NULL,
    "availableModels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "providerId" UUID,
    "model" TEXT,
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "modelUsed" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebSearch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebSearch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchCache" (
    "id" UUID NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "summary" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiUsageLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "providerType" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE INDEX "User_email_idx" ON "User"("email");

CREATE INDEX "User_role_idx" ON "User"("role");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE INDEX "Session_refreshTokenHash_idx" ON "Session"("refreshTokenHash");

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

CREATE INDEX "Subscription_planTier_idx" ON "Subscription"("planTier");

CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

CREATE UNIQUE INDEX "AiProvider_name_key" ON "AiProvider"("name");

CREATE INDEX "AiProvider_providerType_idx" ON "AiProvider"("providerType");

CREATE INDEX "AiProvider_isEnabled_idx" ON "AiProvider"("isEnabled");

CREATE INDEX "AiProvider_isDefault_idx" ON "AiProvider"("isDefault");

CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

CREATE INDEX "Conversation_providerId_idx" ON "Conversation"("providerId");

CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");

CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

CREATE INDEX "WebSearch_userId_idx" ON "WebSearch"("userId");

CREATE INDEX "WebSearch_query_idx" ON "WebSearch"("query");

CREATE INDEX "WebSearch_createdAt_idx" ON "WebSearch"("createdAt");

CREATE UNIQUE INDEX "SearchCache_queryHash_key" ON "SearchCache"("queryHash");

CREATE INDEX "SearchCache_queryHash_idx" ON "SearchCache"("queryHash");

CREATE INDEX "SearchCache_expiresAt_idx" ON "SearchCache"("expiresAt");

CREATE INDEX "ApiUsageLog_userId_idx" ON "ApiUsageLog"("userId");

CREATE INDEX "ApiUsageLog_endpoint_idx" ON "ApiUsageLog"("endpoint");

CREATE INDEX "ApiUsageLog_statusCode_idx" ON "ApiUsageLog"("statusCode");

CREATE INDEX "ApiUsageLog_createdAt_idx" ON "ApiUsageLog"("createdAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebSearch" ADD CONSTRAINT "WebSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
