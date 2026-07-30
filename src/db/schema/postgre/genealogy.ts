import { integer, pgTable, text } from 'drizzle-orm/pg-core'

/**
 * 族谱成员表（PostgreSQL）。
 */
export const genealogy = pgTable('genealogy', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: text('name').notNull(),
    parent: integer('parent').notNull(),
    sex: text('sex'),
    desc: text('desc'),
    parent_name: text('parent_name'),
})

export type GenealogyRow = typeof genealogy.$inferSelect
export type NewGenealogyRow = typeof genealogy.$inferInsert
