import type { Pool } from 'pg'

const CORE_TABLES = [
    'users',
    'articles',
    'categories',
    'comments',
    'admins',
    'likes',
] as const

/**
 * 检测 PostgreSQL public schema 中是否已存在核心业务表。
 */
export async function hasPostgresSchemaTables(pool: Pool): Promise<boolean> {
    const { rows } = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY($1::text[])
        ) AS exists`,
        [CORE_TABLES],
    )

    return rows[0]?.exists ?? false
}
