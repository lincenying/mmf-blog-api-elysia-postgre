import { config } from '~/config'

export type DbProvider = 'sqlite' | 'postgresql'

/**
 * 解析当前应使用的数据库驱动。
 * 优先级：DB_PROVIDER 环境变量 > 生产 postgresql / 开发 sqlite。
 */
export function getDbProvider(): DbProvider {
    const explicit = config.db.provider
    if (explicit === 'sqlite' || explicit === 'postgresql') {
        return explicit
    }
    return config.server.nodeEnv === 'production' ? 'postgresql' : 'sqlite'
}
