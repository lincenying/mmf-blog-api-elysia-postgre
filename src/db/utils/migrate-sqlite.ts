import process from 'node:process'
import { migrate as migrateSqlite } from 'drizzle-orm/bun-sqlite/migrator'
import { db } from '../bun-sqlite'

(async () => {
    try {
        await migrateSqlite(db, { migrationsFolder: './drizzle-sqlite' })
        console.log('SQLite migrations applied.')
    }
    catch (err) {
        console.error('SQLite migration failed:', err)
        process.exit(1)
    }
})()
