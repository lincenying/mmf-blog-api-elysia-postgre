import process from 'node:process'
import { Database } from 'bun:sqlite'
import { sql } from 'drizzle-orm'
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite'
import { config } from '~/config'
import { db, pool } from '~/db/postgre-sql'
import * as postgreSchema from '~/db/schema/postgre'
import * as sqliteSchema from '~/db/schema/sqlite'
import { ensurePostgresDatabase } from '~/db/utils/ensure-postgres-db'

/**
 * 将本地 SQLite 中的 genealogy 数据幂等同步到 PostgreSQL（按 id upsert）。
 * 使用前请先执行 `bun run db:postgre:migrate` 确保表结构已就绪。
 */
async function migrateGenealogyToPostgres() {
    await ensurePostgresDatabase()

    const sqlite = new Database(config.db.sqlite)
    const sqliteDb = drizzleSqlite({ client: sqlite, schema: sqliteSchema })
    const rows = await sqliteDb.select().from(sqliteSchema.genealogy)

    console.log(`[genealogy] SQLite 记录数: ${rows.length}`)

    let upserted = 0
    for (const row of rows) {
        await db
            .insert(postgreSchema.genealogy)
            .values({
                id: row.id,
                name: row.name,
                parent: row.parent,
                sex: row.sex,
                desc: row.desc,
                parent_name: row.parent_name,
            })
            .onConflictDoUpdate({
                target: postgreSchema.genealogy.id,
                set: {
                    name: row.name,
                    parent: row.parent,
                    sex: row.sex,
                    desc: row.desc,
                    parent_name: row.parent_name,
                },
            })
        upserted += 1
    }

    // 同步序列，避免后续自增与已导入 id 冲突
    await db.execute(sql`
        SELECT setval(
            pg_get_serial_sequence('genealogy', 'id'),
            COALESCE((SELECT MAX(id) FROM genealogy), 1),
            true
        )
    `)

    console.log(`[genealogy] 已同步到 PostgreSQL: ${upserted} 条`)
    sqlite.close()
}

;(async () => {
    try {
        await migrateGenealogyToPostgres()
    }
    catch (err) {
        console.error('族谱数据迁移到 PostgreSQL 失败:', err)
        process.exit(1)
    }
    finally {
        await pool.end()
    }
})()
