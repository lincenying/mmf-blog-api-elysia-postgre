/* eslint-disable node/prefer-global/process */
/**
 * Bun test preload：在导入业务代码前固定 SQLite 测试库，避免打到开发库或 PostgreSQL。
 */
process.env.NODE_ENV = 'development'
process.env.DB_PROVIDER = 'sqlite'
process.env.SQLITE_DB_URL = './.data/test.sqlite3'
