import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * 族谱成员表（SQLite）。
 */
export const genealogy = sqliteTable('genealogy', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    parent: integer('parent').notNull(),
    sex: text('sex'),
    desc: text('desc'),
    parent_name: text('parent_name'),
})

export type GenealogyRow = typeof genealogy.$inferSelect
export type NewGenealogyRow = typeof genealogy.$inferInsert
