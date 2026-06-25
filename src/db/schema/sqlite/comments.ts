import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comments = sqliteTable('comments', {
    _id: text('_id').primaryKey(),
    article_id: text('article_id').notNull(),
    userid: text('userid').notNull(),
    content: text('content').notNull(),
    creat_date: text('creat_date').notNull().default(''),
    is_delete: integer('is_delete').notNull().default(0),
    timestamp: integer('timestamp'),
})

export type CommentRow = typeof comments.$inferSelect
export type NewCommentRow = typeof comments.$inferInsert
