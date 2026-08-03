import { integer, pgTable, text } from 'drizzle-orm/pg-core'

/**
 * 归档内容表（PostgreSQL）。
 */
export const archive = pgTable('archive', {
    c_id: integer('c_id').primaryKey().generatedByDefaultAsIdentity(),
    c_title: text('c_title'),
    c_intro: text('c_intro'),
    c_content: text('c_content'),
    c_view: integer('c_view'),
    c_posttime: text('c_posttime'),
})

export type ArchiveRow = typeof archive.$inferSelect
export type NewArchiveRow = typeof archive.$inferInsert
