import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const admins = pgTable('admins', {
    _id: text('_id').primaryKey(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    creat_date: text('creat_date').notNull().default(''),
    update_date: text('update_date').notNull().default(''),
    is_delete: integer('is_delete').notNull().default(0),
    timestamp: integer('timestamp'),
})

export type AdminRow = typeof admins.$inferSelect
export type NewAdminRow = typeof admins.$inferInsert
