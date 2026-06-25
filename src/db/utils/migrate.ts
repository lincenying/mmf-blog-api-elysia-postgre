import process from 'node:process'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from '../postgre-sql'
import { ensurePostgresDatabase } from './ensure-postgres-db'
import { hasPostgresSchemaTables } from './has-postgres-schema-tables'

(async () => {
    try {
        await ensurePostgresDatabase()

        if (await hasPostgresSchemaTables(pool)) {
            console.log('[postgres] schema tables already exist, skipping migrations.')
            return
        }

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
