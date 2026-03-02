/**
 * Mindforge Backend — Configuration Factory
 *
 * Typed configuration read from environment variables.
 * Used by NestJS ConfigModule.forRoot().
 */

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  /** HTTPS enforcement — enable behind load balancer in production */
  enforceHttps: process.env.ENFORCE_HTTPS === 'true',

  /** Trust proxy — enable when behind LB / reverse proxy */
  trustProxy: process.env.TRUST_PROXY === 'true',

  /** CORS origins (comma-separated) */
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3001'],

  /** Global rate limiting */
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  /** JWT configuration (Task 1.2) */
  jwt: {
    secret: process.env.JWT_SECRET ?? 'CHANGE_ME_IN_PRODUCTION_use_vault',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },

  /** AI provider configuration (Task 4.1) */
  ai: {
    /** OpenAI-compatible API base URL */
    baseUrl: process.env.AI_BASE_URL ?? 'https://api.openai.com/v1',
    /** API key — must be in vault for production */
    apiKey: process.env.AI_API_KEY ?? '',
    /** Model for grading (cheap tier) */
    gradingModel: process.env.AI_GRADING_MODEL ?? 'gpt-4o-mini',
    /** Model for feedback/doubt (higher tier) */
    feedbackModel: process.env.AI_FEEDBACK_MODEL ?? 'gpt-4o-mini',
    /** Request timeout in milliseconds */
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '10000', 10),
    /** Maximum tokens per AI response */
    maxTokens: parseInt(process.env.AI_MAX_TOKENS ?? '512', 10),
    /** Temperature for deterministic-style responses */
    temperature: parseFloat(process.env.AI_TEMPERATURE ?? '0.3'),
  },

  /** Database configuration (Task 2.1) */
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'mindforge',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'mindforge',
    sqlitePath: process.env.SQLITE_PATH ?? ':memory:',
  },
});
