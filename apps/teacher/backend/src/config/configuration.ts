export default () => ({
  port: parseInt(process.env.TEACHER_SERVICE_PORT ?? '3003', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  enforceHttps: process.env.ENFORCE_HTTPS === 'true',
  trustProxy: process.env.TRUST_PROXY === 'true',

  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5175'],

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'CHANGE_ME_IN_PRODUCTION_use_vault',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },

  ai: {
    baseUrl: process.env.AI_BASE_URL ?? 'https://api.openai.com/v1',
    apiKey: process.env.AI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
    embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '15000', 10),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS ?? '1024', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE ?? '0.3'),
  },

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'mindforge',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'mindforge_teacher',
    sqlitePath: process.env.SQLITE_PATH ?? ':memory:',
  },

  storage: {
    syllabusPath: process.env.SYLLABUS_STORAGE_PATH ?? './uploads/syllabus',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '20', 10),
  },

  performance: {
    slowRequestThresholdMs: parseInt(
      process.env.SLOW_REQUEST_THRESHOLD_MS ?? '500',
      10,
    ),
    criticalFlows: {
      attendanceSave: 300,
      syllabusUpload: 1000,
      testGeneration: 10000,
      analyticsKpis: 400,
      sessionsList: 200,
    },
  },
});
