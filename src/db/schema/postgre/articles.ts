import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const articles = pgTable('articles', {
    _id: text('_id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    html: text('html').notNull().default(''),
    toc: text('toc').notNull().default(''),
    category: text('category').notNull().default(''),
    category_name: text('category_name').notNull().default(''),
    visit: integer('visit').notNull().default(0),
    like: integer('like').notNull().default(0),
    comment_count: integer('comment_count').notNull().default(0),
    creat_date: text('creat_date').notNull().default(''),
    update_date: text('update_date').notNull().default(''),
    is_delete: integer('is_delete').notNull().default(0),
    timestamp: integer('timestamp'),
})

export type ArticleRow = typeof articles.$inferSelect
export type NewArticleRow = typeof articles.$inferInsert
