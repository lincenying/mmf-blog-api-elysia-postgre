import process from 'node:process'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from '../postgre-sql'
import { ensurePostgresDatabase } from './ensure-postgres-db'

(async () => {
    try {
        await ensurePostgresDatabase()
        await migratePg(db, { migrationsFolder: './drizzle-postgre' })
        console.log('PostgreSQL migrations applied.')
    }
    catch (err) {
        console.error('PostgreSQL migration failed:', err)
        process.exit(1)
    }
    finally {
        await pool.end()
    }
})()
