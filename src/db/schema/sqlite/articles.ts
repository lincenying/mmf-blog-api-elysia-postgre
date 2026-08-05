import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const articles = sqliteTable('articles', {
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
}, table => [
    /** 前台默认列表：is_delete + update_date 排序 */
    index('idx_articles_is_delete_update_date').on(table.is_delete, table.update_date),
    /** 按分类列表：is_delete + category + update_date 排序 */
    index('idx_articles_is_delete_category_update_date').on(table.is_delete, table.category, table.update_date),
    /** 热门推荐：is_delete + category + visit 排序 */
    index('idx_articles_is_delete_category_visit').on(table.is_delete, table.category, table.visit),
])

export type ArticleRow = typeof articles.$inferSelect
export type NewArticleRow = typeof articles.$inferInsert
