/**
 * Convict 配置模式定义
 *
 * 该文件定义了所有配置项的模式、类型、默认值和验证规则
 */

import convict from 'convict'

// 添加自定义格式验证器
convict.addFormat({
    name: 'cors-origin',
    validate(val: unknown) {
        if (typeof val === 'boolean') {
            return
        }
        if (typeof val === 'string') {
            // 验证 URL 格式或通配符
            if (
                val === '*'
                || val.startsWith('http://')
                || val.startsWith('https://')
            ) {
                return
            }
        }
        if (Array.isArray(val) && val.every(item => typeof item === 'string')) {
            return
        }
        throw new Error('Must be a boolean, string, or array of strings')
    },
    coerce(val: unknown) {
        if (typeof val === 'string') {
            // 如果是逗号分隔的字符串，转换为数组
            if (val.includes(',')) {
                return val.split(',').map(s => s.trim())
            }
        }
        return val
    },
})

convict.addFormat({
    name: 'comma-separated-strings',
    validate(val: unknown): void {
        if (Array.isArray(val) && val.every(item => typeof item === 'string')) {
            return
        }
        throw new Error('Must be an array of strings')
    },
    coerce(val: string | string[]): string[] {
        if (typeof val === 'string') {
            return val
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
        }
        return Array.isArray(val) ? val : []
    },
})

/**
 * 应用配置模式
 */
export const configSchema = {
    // 应用基本信息
    app: {
        name: {
            doc: '应用程序名称',
            format: String,
            default: '',
            env: 'APP_NAME',
        },
        version: {
            doc: '应用程序版本号',
            format: String,
            default: '',
            env: 'APP_VERSION',
        },
        description: {
            doc: '应用程序描述',
            format: String,
            default: '',
            env: 'APP_DESCRIPTION',
        },
    },

    // 服务器配置
    server: {
        nodeEnv: {
            doc: 'Node.js 运行环境',
            format: ['development', 'production', 'test'],
            default: 'development' as 'development' | 'production' | 'test',
            env: 'NODE_ENV',
        },
        port: {
            doc: '服务监听端口',
            format: 'port',
            default: 4000,
            env: 'PORT',
        },
        host: {
            doc: '服务绑定的主机地址',
            format: String,
            default: '0.0.0.0',
            env: 'HOST',
        },
        externalPort: {
            doc: '外部访问端口（用于 Docker 环境）',
            format: 'port',
            default: null as number | null,
            env: 'EXTERNAL_APP_PORT',
            nullable: true,
        },
        externalHost: {
            doc: '外部访问主机（用于 Docker 环境）',
            format: String,
            default: null as string | null,
            env: 'EXTERNAL_APP_HOST',
            nullable: true,
        },
    },

    // CORS 配置
    cors: {
        origin: {
            doc: '允许访问的源',
            format: 'cors-origin',
            default: 'http://localhost:4000',
            env: 'CORS_ORIGIN',
        },
        credentials: {
            doc: '是否允许携带凭证',
            format: Boolean,
            default: true,
            env: 'CORS_CREDENTIALS',
        },
        methods: {
            doc: '允许的HTTP方法',
            format: 'comma-separated-strings',
            default: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            env: 'CORS_METHODS',
        },
    },

    // 日志配置
    log: {
        level: {
            doc: '日志级别',
            format: ['error', 'warn', 'info', 'debug', 'trace'],
            default: 'info' as 'info' | 'warn' | 'error' | 'debug' | 'trace',
            env: 'LOG_LEVEL',
        },
    },

    // Swagger 配置
    swagger: {
        path: {
            doc: 'Swagger文档访问路径',
            format: String,
            default: '/docs',
            env: 'SWAGGER_PATH',
        },
        title: {
            doc: 'API文档标题',
            format: String,
            default: 'MMF Blog API',
            env: 'SWAGGER_TITLE',
        },
        version: {
            doc: 'API版本号',
            format: String,
            default: '1.0.0',
            env: 'SWAGGER_VERSION',
        },
        description: {
            doc: 'API描述信息',
            format: String,
            default: 'A modern web API built with Bun and ElysiaJS',
            env: 'SWAGGER_DESCRIPTION',
        },
    },

    // 静态文件配置
    static: {
        assetsPath: {
            doc: '静态资源文件路径',
            format: String,
            default: './public',
            env: 'STATIC_ASSETS_PATH',
        },
        prefix: {
            doc: '静态资源URL前缀',
            format: String,
            default: '/static',
            env: 'STATIC_PREFIX',
        },
    },

    md5_salt: {
        doc: 'MD5 盐值',
        format: String,
        default: '!@#$%(*&^)',
        env: 'MD5_SALT',
    },

    // JWT / Cookie 会话（密钥仍由 _secret.js 管理）
    jwt: {
        expiresInSeconds: {
            doc: 'JWT 与 HttpOnly Cookie 有效期（秒）',
            format: 'int',
            default: 60 * 60 * 24 * 30,
            env: 'JWT_EXPIRES_IN_SECONDS',
        },
    },

    // 数据库配置
    db: {
        provider: {
            doc: '数据库驱动：sqlite | postgresql；未设置时开发环境默认 sqlite，生产环境默认 postgresql',
            format: ['sqlite', 'postgresql'],
            default: null as 'sqlite' | 'postgresql' | null,
            env: 'DB_PROVIDER',
            nullable: true,
        },
        sqlite: {
            doc: 'SQLite 文件路径',
            format: String,
            default: './.data/db.sqlite3',
            env: 'SQLITE_DB_URL',
        },
        postgre_host: {
            doc: 'PostgreSQL 主机',
            format: String,
            default: 'localhost',
            env: 'POSTGRES_HOST',
        },
        postgre_port: {
            doc: 'PostgreSQL 端口',
            format: 'port',
            default: 5432,
            env: 'POSTGRES_PORT',
        },
        postgre_user: {
            doc: 'PostgreSQL 用户',
            format: String,
            default: 'postgres',
            env: 'POSTGRES_USER',
        },
        postgre_password: {
            doc: 'PostgreSQL 密码',
            format: String,
            default: '',
            env: 'POSTGRES_PASSWORD',
        },
        postgre_db: {
            doc: 'PostgreSQL 数据库',
            format: String,
            default: '',
            env: 'POSTGRES_DB',
        },
    },
}
