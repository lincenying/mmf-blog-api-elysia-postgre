import process from 'node:process'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from '../postgre-sql'
import { ensurePostgresDatabase } from './ensure-postgres-db'
import { hasPostgresSchemaTables } from './has-postgres-schema-tables'

/**
 * 执行 PostgreSQL 结构迁移：必要时建库，再应用 drizzle-postgre。
 * 若核心业务表已存在（旧库换基线等），跳过基线迁移，避免 CREATE TABLE 冲突。
 */
async function runPostgresMigrate() {
    await ensurePostgresDatabase()

    if (await hasPostgresSchemaTables(pool)) {
        console.log('[postgres] schema tables already exist, skipping baseline migrations.')
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
