import type { Database } from 'bun:sqlite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { migrate as migrateSqlite } from 'drizzle-orm/bun-sqlite/migrator'
import { db, sqlite } from '../bun-sqlite'

const MIGRATIONS_FOLDER = './drizzle-sqlite'

interface IDrizzleJournal {
    entries: Array<{ tag: string }>
}

/**
 * 定位当前基线迁移 SQL。索引已写在该文件中。
 */
function resolveBaselineSql(folder: string) {
    const journal = JSON.parse(readFileSync(resolve(folder, 'meta/_journal.json'), 'utf8')) as IDrizzleJournal
    const tag = journal.entries[0]?.tag
    if (!tag) {
        throw new Error(`[migrate] ${folder} 缺少基线迁移记录`)
    }
    return resolve(folder, `${tag}.sql`)
}

/**
 * 从基线 SQL 取出建索引语句，并改成可重复执行。
 */
function loadIndexStatements(folder: string) {
    const sql = readFileSync(resolveBaselineSql(folder), 'utf8')
    return sql
        .split('--> statement-breakpoint')
        .map(part => part.trim())
        .filter(part => /^CREATE (UNIQUE )?INDEX\b/i.test(part))
        .map(part => part
            .replace(/^CREATE UNIQUE INDEX\b/i, 'CREATE UNIQUE INDEX IF NOT EXISTS')
            .replace(/^CREATE INDEX\b/i, 'CREATE INDEX IF NOT EXISTS'))
}

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
 * 在已有库上幂等补齐基线里的索引。
 */
function applyIndexMigration(client: Database) {
    const statements = loadIndexStatements(MIGRATIONS_FOLDER)
    for (const statement of statements) {
        client.run(statement)
    }
}

/**
 * 执行 SQLite 结构迁移：应用 drizzle-sqlite。
 * 若核心业务表已存在，跳过建表，仍从基线 SQL 补齐索引。
 */
async function runSqliteMigrate() {
    if (hasSqliteSchemaTables(sqlite)) {
        console.log('[sqlite] schema tables already exist, skipping baseline migrations.')
        applyIndexMigration(sqlite)
        console.log('[sqlite] indexes ensured.')
        return
    }

    await migrateSqlite(db, { migrationsFolder: MIGRATIONS_FOLDER })
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
