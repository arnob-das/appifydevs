export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum PlanTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE',
}

export enum ProviderType {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI',
  CUSTOM = 'CUSTOM',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export interface PlanConfig {
  dailyRequestsLimit: number;
  monthlyTokensLimit: number;
  supportedModels: string[];
  streamingEnabled: boolean;
  prioritySupport: boolean;
  pricePerMonth: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanConfig> = {
  [PlanTier.FREE]: {
    dailyRequestsLimit: 20,
    monthlyTokensLimit: 100_000,
    supportedModels: ['gpt-3.5-turbo', 'claude-3-haiku', 'gemini-1.5-flash'],
    streamingEnabled: true,
    prioritySupport: false,
    pricePerMonth: 0,
  },
  [PlanTier.PREMIUM]: {
    dailyRequestsLimit: 500,
    monthlyTokensLimit: 2_000_000,
    supportedModels: [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'claude-3-5-sonnet',
      'claude-3-haiku',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    streamingEnabled: true,
    prioritySupport: true,
    pricePerMonth: 19.99,
  },
  [PlanTier.ENTERPRISE]: {
    dailyRequestsLimit: 5000,
    monthlyTokensLimit: 20_000_000,
    supportedModels: [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'claude-3-5-sonnet',
      'claude-3-opus',
      'claude-3-haiku',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    streamingEnabled: true,
    prioritySupport: true,
    pricePerMonth: 99.99,
  },
};
