import type { PoolConfig } from 'pg'

import { config } from '~/config'

/**
 * 组装 PostgreSQL 连接参数。密码按字段传入，避免拼进 URI 时被 `@`、`:` 截断。
 */
export function postgresClientConfig(database: string): PoolConfig {
    return {
        host: config.db.postgre_host,
        port: config.db.postgre_port,
        user: config.db.postgre_user,
        password: config.db.postgre_password,
        database,
        connectionTimeoutMillis: 10_000,
    }
}
