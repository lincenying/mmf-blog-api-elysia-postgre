import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    _id: text('_id').primaryKey(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    creat_date: text('creat_date').notNull().default(''),
    update_date: text('update_date').notNull().default(''),
    is_delete: integer('is_delete').notNull().default(0),
    timestamp: integer('timestamp'),
    wx_avatar: text('wx_avatar'),
    wx_signature: text('wx_signature'),
})

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
