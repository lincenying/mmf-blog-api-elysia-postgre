import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { config } from '~/config'
import * as schema from '~/db/schema/sqlite'
import { getDbProvider } from '~/db/utils/provider'

/**
 * 打开 SQLite 文件并创建 Drizzle 客户端。
 */
function openSqliteDatabase() {
    mkdirSync(dirname(config.db.sqlite), { recursive: true })
    const sqlite = new Database(config.db.sqlite)
    const db = drizzle({ client: sqlite, schema })
    return { sqlite, db }
}

/**
 * 仅在 sqlite 驱动下打开数据库文件。
 * PostgreSQL 模式下跳过：容器内会跟随宿主机软链接，目标路径不存在时会 SQLITE_CANTOPEN。
 */
const sqliteRuntime = getDbProvider() === 'sqlite' ? openSqliteDatabase() : undefined

export const sqlite = sqliteRuntime?.sqlite as Database
export const db = sqliteRuntime?.db as ReturnType<typeof openSqliteDatabase>['db']
