import type { Pool } from 'pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from '../postgre-sql'
import { ensurePostgresDatabase } from './ensure-postgres-db'
import { hasPostgresSchemaTables } from './has-postgres-schema-tables'

const INDEX_MIGRATION_FILE = resolve('./drizzle-postgre/0001_add_indexes.sql')

/**
 * 在已有库上幂等执行索引迁移（CREATE INDEX IF NOT EXISTS）。
 */
async function applyIndexMigration(pgPool: Pool) {
    const sql = readFileSync(INDEX_MIGRATION_FILE, 'utf8')
    const statements = sql
        .split('--> statement-breakpoint')
        .map(part => part.trim())
        .filter(Boolean)

    for (const statement of statements) {
        await pgPool.query(statement)
    }
}

/**
 * 执行 PostgreSQL 结构迁移：必要时建库，再应用 drizzle-postgre。
 * 若核心业务表已存在（旧库换基线等），跳过基线迁移，但仍补齐索引。
 */
async function runPostgresMigrate() {
    await ensurePostgresDatabase()

    if (await hasPostgresSchemaTables(pool)) {
        console.log('[postgres] schema tables already exist, skipping baseline migrations.')
        await applyIndexMigration(pool)
        console.log('[postgres] indexes ensured.')
        return
    }

    await migratePg(db, { migrationsFolder: './drizzle-postgre' })
    console.log('PostgreSQL migrations applied.')
}

;(async () => {
    try {
        await runPostgresMigrate()
    }
    catch (err) {
        console.error('PostgreSQL migration failed:', err)
        process.exit(1)
    }
    finally {
        await pool.end()
    }
})()
