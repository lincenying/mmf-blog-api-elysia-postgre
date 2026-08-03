import process from 'node:process'
import { migrate as migrateSqlite } from 'drizzle-orm/bun-sqlite/migrator'
import { db } from '../bun-sqlite'

/**
 * 执行 SQLite 结构迁移：应用 drizzle-sqlite。
 */
async function runSqliteMigrate() {
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
