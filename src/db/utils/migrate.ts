import type { Pool } from 'pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from '../postgre-sql'
import { ensurePostgresDatabase } from './ensure-postgres-db'
import { hasPostgresSchemaTables } from './has-postgres-schema-tables'

const MIGRATIONS_FOLDER = './drizzle-postgre'

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

/**
 * 旧库的 likes 只有主键。点赞语句按文章和用户做 ON CONFLICT，缺少唯一索引会失败。
 */
async function ensureLikesUniqueIndex(pgPool: Pool) {
    await pgPool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS likes_article_id_user_id_unique
        ON likes (article_id, user_id)
    `)
}

/**
 * 在已有库上幂等补齐基线里的索引。
 */
async function applyIndexMigration(pgPool: Pool) {
    const statements = loadIndexStatements(MIGRATIONS_FOLDER)
    for (const statement of statements) {
        await pgPool.query(statement)
    }
    await ensureLikesUniqueIndex(pgPool)
}

/**
 * 执行 PostgreSQL 结构迁移：必要时建库，再应用 drizzle-postgre。
 * 若核心业务表已存在（旧库换基线等），跳过建表，仍从基线 SQL 补齐索引。
 */
async function runPostgresMigrate() {
    await ensurePostgresDatabase()

    if (await hasPostgresSchemaTables(pool)) {
        console.log('[postgres] schema tables already exist, skipping baseline migrations.')
        await applyIndexMigration(pool)
        console.log('[postgres] indexes ensured.')
        return
    }

    await migratePg(db, { migrationsFolder: MIGRATIONS_FOLDER })
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
