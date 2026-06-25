import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

export const articleLikes = pgTable('article_likes', {
    article_id: text('article_id').notNull(),
    user_id: text('user_id').notNull(),
}, table => [
    primaryKey({ columns: [table.article_id, table.user_id] }),
])

export type ArticleLikeRow = typeof articleLikes.$inferSelect
