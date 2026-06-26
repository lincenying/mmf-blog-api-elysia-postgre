import { integer, pgTable, text, unique } from 'drizzle-orm/pg-core'

export const articleLikes = pgTable('likes', {
    _id: text('_id').primaryKey(),
    article_id: text('article_id').notNull(),
    user_id: text('user_id').notNull(),
    creat_date: text('creat_date').notNull().default(''),
    timestamp: integer('timestamp'),
}, table => [
    unique().on(table.article_id, table.user_id),
])

export type ArticleLikeRow = typeof articleLikes.$inferSelect
export type NewArticleLikeRow = typeof articleLikes.$inferInsert
