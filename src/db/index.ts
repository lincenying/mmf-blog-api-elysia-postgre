/**
 * Drizzle 统一出口：按 DB_PROVIDER / 环境自动选择 SQLite 或 PostgreSQL。
 */
import { db as sqliteDb } from './bun-sqlite'
import { db as postgreDb } from './postgre-sql'
import * as postgreSchema from './schema/postgre'
import * as sqliteSchema from './schema/sqlite'
import { getDbProvider } from './utils/provider'

export { getDbProvider } from './utils/provider'
export type { DbProvider } from './utils/provider'

export const dbProvider = getDbProvider()

/** 统一 Drizzle 实例（结构对齐 PostgreSQL 驱动类型） */
export const db = (dbProvider === 'postgresql' ? postgreDb : sqliteDb) as typeof postgreDb

const schema = dbProvider === 'postgresql' ? postgreSchema : sqliteSchema

export const admins = schema.admins as typeof postgreSchema.admins
export const articleLikes = schema.articleLikes as typeof postgreSchema.articleLikes
export const articles = schema.articles as typeof postgreSchema.articles
export const categories = schema.categories as typeof postgreSchema.categories
export const comments = schema.comments as typeof postgreSchema.comments
export const users = schema.users as typeof postgreSchema.users

/** @deprecated 请使用统一的 `db` */
export { sqliteDb }
/** @deprecated 请使用统一的 `db` */
export { postgreDb }
