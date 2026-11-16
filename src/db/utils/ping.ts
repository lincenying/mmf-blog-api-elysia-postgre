import { sqlite } from '~/db/bun-sqlite'
import { pool } from '~/db/postgre-sql'
import { getDbProvider } from '~/db/utils/provider'

/**
 * 确认当前数据库可以执行查询。
 */
export async function pingDatabase(): Promise<void> {
    if (getDbProvider() === 'sqlite') {
        sqlite.query('select 1').get()
        return
    }

    await pool.query('select 1')
}
