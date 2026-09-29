export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
  corsOrigin: string;
  encryptionKey: string;
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  database: {
    url: string;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  aiKeys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
  };
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  encryptionKey:
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      'echogpt_super_secret_access_jwt_key_2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'echogpt_super_secret_refresh_jwt_key_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://echogpt_user:echogpt_password@localhost:5432/echogpt_db?schema=public',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  aiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  },
});
