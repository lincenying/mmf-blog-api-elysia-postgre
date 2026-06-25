import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { config } from '~/config'
import * as schema from '~/db/schema/postgre'

const { postgre_user, postgre_password, postgre_host, postgre_port, postgre_db } = config.db

export const pool = new Pool({
    connectionString: `postgresql://${postgre_user}:${postgre_password}@${postgre_host}:${postgre_port}/${postgre_db}`,
})

export const db = drizzle(pool, { schema })
