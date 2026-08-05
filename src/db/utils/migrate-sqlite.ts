import type { Database } from 'bun:sqlite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { migrate as migrateSqlite } from 'drizzle-orm/bun-sqlite/migrator'
import { db, sqlite } from '../bun-sqlite'

const INDEX_MIGRATION_FILE = resolve('./drizzle-sqlite/0001_add_indexes.sql')

const CORE_TABLES = [
    'users',
    'articles',
    'categories',
    'comments',
    'admins',
    'likes',
] as const

/**
 * 检测 SQLite 是否已存在核心业务表。
 */
function hasSqliteSchemaTables(client: Database): boolean {
    const placeholders = CORE_TABLES.map(() => '?').join(', ')
    const row = client
        .query(
            `SELECT 1 AS ok
            FROM sqlite_master
            WHERE type = 'table'
            AND name IN (${placeholders})
            LIMIT 1`,
        )
        .get(...CORE_TABLES) as { ok: number } | null

    return row != null
}

/**
 * 在已有库上幂等执行索引迁移（CREATE INDEX IF NOT EXISTS）。
 */
function applyIndexMigration(client: Database) {
    const sqlText = readFileSync(INDEX_MIGRATION_FILE, 'utf8')
    const statements = sqlText
        .split('--> statement-breakpoint')
        .map(part => part.trim())
        .filter(Boolean)

    for (const statement of statements) {
        client.run(statement)
    }
}

/**
 * 执行 SQLite 结构迁移：应用 drizzle-sqlite。
 * 若核心业务表已存在，跳过基线迁移，但仍补齐索引。
 */
async function runSqliteMigrate() {
    if (hasSqliteSchemaTables(sqlite)) {
        console.log('[sqlite] schema tables already exist, skipping baseline migrations.')
        applyIndexMigration(sqlite)
        console.log('[sqlite] indexes ensured.')
        return
    }

    await migrateSqlite(db, { migrationsFolder: './drizzle-sqlite' })
    console.log('SQLite migrations applied.')
}

;(async () => {
    try {
        await runSqliteMigrate()
    }
    catch (err) {
        console.error('SQLite migration failed:', err)
        process.exit(1)
    }
})()
