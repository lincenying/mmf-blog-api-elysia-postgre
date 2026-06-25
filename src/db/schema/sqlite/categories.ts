import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
    _id: text('_id').primaryKey(),
    cate_name: text('cate_name').notNull(),
    cate_order: text('cate_order').notNull().default(''),
    cate_num: integer('cate_num').notNull().default(0),
    creat_date: text('creat_date').notNull().default(''),
    update_date: text('update_date').notNull().default(''),
    is_delete: integer('is_delete').notNull().default(0),
    timestamp: integer('timestamp'),
})

export type CategoryRow = typeof categories.$inferSelect
export type NewCategoryRow = typeof categories.$inferInsert
