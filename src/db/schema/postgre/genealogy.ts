import { index, integer, pgTable, text } from 'drizzle-orm/pg-core'

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
}, table => [
    /** 查子节点 / 删除前校验是否有子节点 */
    index('idx_genealogy_parent').on(table.parent),
])

export type GenealogyRow = typeof genealogy.$inferSelect
export type NewGenealogyRow = typeof genealogy.$inferInsert
