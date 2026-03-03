import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from './database.module';

/**
 * TypeORM CLI data source for running migrations outside NestJS.
 * Usage: npx typeorm migration:run -d dist/database/data-source.js
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'mindforge',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'mindforge_teacher',
  entities: ALL_ENTITIES,
  migrations: ['dist/database/migrations/*.js'],
  logging: ['error', 'warn', 'schema'],
});
