import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const articleLikes = sqliteTable('likes', {
    _id: text('_id').primaryKey(),
    article_id: text('article_id').notNull(),
    user_id: text('user_id').notNull(),
    creat_date: text('creat_date').notNull().default(''),
    timestamp: integer('timestamp'),
}, table => [
    unique().on(table.article_id, table.user_id),
    /** 查询用户已点赞文章列表（unique 左前缀为 article_id，需单独索引 user_id） */
    index('idx_likes_user_id').on(table.user_id),
])

export type ArticleLikeRow = typeof articleLikes.$inferSelect
export type NewArticleLikeRow = typeof articleLikes.$inferInsert
