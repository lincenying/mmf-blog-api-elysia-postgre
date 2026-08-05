import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
}, table => [
    /** 查子节点 / 删除前校验是否有子节点 */
    index('idx_genealogy_parent').on(table.parent),
])

export type GenealogyRow = typeof genealogy.$inferSelect
export type NewGenealogyRow = typeof genealogy.$inferInsert
