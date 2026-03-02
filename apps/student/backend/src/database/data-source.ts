/**
 * Mindforge Backend — TypeORM Data Source (Task 2.1)
 *
 * Used by TypeORM CLI for migration generation and execution.
 * Usage: npx typeorm migration:generate -d src/database/data-source.ts
 *
 * For production PostgreSQL. Dev uses in-memory SQLite via DatabaseModule.
 */

import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from './database.module';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://mindforge:mindforge@localhost:5432/mindforge',
  entities: ALL_ENTITIES,
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: ['error', 'warn', 'schema', 'migration'],
});
