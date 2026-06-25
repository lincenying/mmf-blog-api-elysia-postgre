import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { config } from '~/config'
import * as schema from '~/db/schema/sqlite'

mkdirSync(dirname(config.db.sqlite), { recursive: true })

const sqlite = new Database(config.db.sqlite)
export const db = drizzle({ client: sqlite, schema })
