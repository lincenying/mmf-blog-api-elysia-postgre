import { defineConfig } from 'drizzle-kit'
import { config } from '~/config'

const {
    postgre_user,
    postgre_password,
    postgre_host,
    postgre_port,
    postgre_db,
} = config.db

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/db/schema/postgre/index.ts',
    out: './drizzle-postgre',
    dbCredentials: {
        url: `postgresql://${postgre_user}:${postgre_password}@${postgre_host}:${postgre_port}/${postgre_db}`,
    },
    verbose: true,
    strict: true,
})
