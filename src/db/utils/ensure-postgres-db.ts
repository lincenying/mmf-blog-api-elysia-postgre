import { Client } from 'pg'
import { config } from '~/config'

const DB_NAME_PATTERN = /^[a-z_]\w*$/i

/**
 * 目标库不存在时自动创建（连接默认库 postgres 执行）。
 */
export async function ensurePostgresDatabase() {
    const {
        postgre_user,
        postgre_password,
        postgre_host,
        postgre_port,
        postgre_db,
    } = config.db

    if (!DB_NAME_PATTERN.test(postgre_db)) {
        throw new Error(`Invalid PostgreSQL database name: ${postgre_db}`)
    }

    const client = new Client({
        connectionString: `postgresql://${postgre_user}:${postgre_password}@${postgre_host}:${postgre_port}/postgres`,
    })

    try {
        await client.connect()
        const { rows } = await client.query<{ exists: number }>(
            'SELECT 1 AS exists FROM pg_database WHERE datname = $1',
            [postgre_db],
        )

        if (rows.length === 0) {
            // 使用 template0，避免 template1 被其他会话占用时建库失败（55006）
            await client.query(`CREATE DATABASE "${postgre_db}" TEMPLATE template0 ENCODING 'UTF8'`)
            console.log(`[postgres] created database: ${postgre_db}`)
        }
    }
    finally {
        await client.end()
    }
}
