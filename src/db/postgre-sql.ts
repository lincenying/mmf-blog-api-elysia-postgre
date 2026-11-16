import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { config } from '~/config'
import * as schema from '~/db/schema/postgre'
import { postgresClientConfig } from '~/db/utils/postgres-client'

export const pool = new Pool(postgresClientConfig(config.db.postgre_db))

export const db = drizzle(pool, { schema })
