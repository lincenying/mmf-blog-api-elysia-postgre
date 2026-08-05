import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comments = sqliteTable('comments', {
    _id: text('_id').primaryKey(),
    article_id: text('article_id').notNull(),
    userid: text('userid').notNull(),
    content: text('content').notNull(),
    creat_date: text('creat_date').notNull().default(''),
    is_delete: integer('is_delete').notNull().default(0),
    timestamp: integer('timestamp'),
}, table => [
    /** 按文章拉评论列表：article_id + is_delete */
    index('idx_comments_article_id_is_delete').on(table.article_id, table.is_delete),
    /** 关联用户信息 */
    index('idx_comments_userid').on(table.userid),
])

export type CommentRow = typeof comments.$inferSelect
export type NewCommentRow = typeof comments.$inferInsert
