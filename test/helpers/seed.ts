import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import md5 from 'md5'

import { config } from '~/config'
import {
    admins,
    articleLikes,
    articles,
    categories,
    comments,
    genealogy,
    sqliteDb,
    users,
} from '~/db'
import { getNowTime } from '~/utils'

import { FIXTURES } from './fixtures'

let migrated = false

/**
 * 对测试 SQLite 执行一次迁移。
 */
export async function ensureTestDbMigrated() {
    if (migrated) {
        return
    }
    await migrate(sqliteDb, { migrationsFolder: './drizzle-sqlite' })
    migrated = true
}

/**
 * 清空业务表并写入固定夹具数据。
 */
export async function resetAndSeed() {
    await sqliteDb.delete(articleLikes)
    await sqliteDb.delete(comments)
    await sqliteDb.delete(articles)
    await sqliteDb.delete(categories)
    await sqliteDb.delete(users)
    await sqliteDb.delete(admins)
    await sqliteDb.delete(genealogy)

    const now = getNowTime()
    const ts = Number(getNowTime('X'))
    const hash = (password: string) => md5(config.md5_salt + password)

    await sqliteDb.insert(admins).values([
        {
            _id: FIXTURES.admin.id,
            username: FIXTURES.admin.username,
            email: FIXTURES.admin.email,
            password: hash(FIXTURES.admin.password),
            creat_date: now,
            update_date: now,
            is_delete: 0,
            timestamp: ts,
        },
        {
            _id: FIXTURES.adminOther.id,
            username: FIXTURES.adminOther.username,
            email: FIXTURES.adminOther.email,
            password: hash(FIXTURES.adminOther.password),
            creat_date: now,
            update_date: now,
            is_delete: 0,
            timestamp: ts,
        },
    ])

    await sqliteDb.insert(users).values([
        {
            _id: FIXTURES.user.id,
            username: FIXTURES.user.username,
            email: FIXTURES.user.email,
            password: hash(FIXTURES.user.password),
            creat_date: now,
            update_date: now,
            is_delete: 0,
            timestamp: ts,
        },
        {
            _id: FIXTURES.userOther.id,
            username: FIXTURES.userOther.username,
            email: FIXTURES.userOther.email,
            password: hash(FIXTURES.userOther.password),
            creat_date: now,
            update_date: now,
            is_delete: 0,
            timestamp: ts,
        },
    ])

    await sqliteDb.insert(categories).values([
        {
            _id: FIXTURES.category.id,
            cate_name: FIXTURES.category.name,
            cate_order: FIXTURES.category.order,
            cate_num: 2,
            creat_date: now,
            is_delete: 0,
            timestamp: ts,
        },
        {
            _id: FIXTURES.categoryOther.id,
            cate_name: FIXTURES.categoryOther.name,
            cate_order: FIXTURES.categoryOther.order,
            cate_num: 0,
            creat_date: now,
            is_delete: 0,
            timestamp: ts,
        },
    ])

    await sqliteDb.insert(articles).values([
        {
            _id: FIXTURES.article.id,
            title: FIXTURES.article.title,
            content: FIXTURES.article.content,
            html: FIXTURES.article.html,
            toc: '',
            category: FIXTURES.category.id,
            category_name: FIXTURES.category.name,
            visit: 1,
            like: 0,
            comment_count: 1,
            creat_date: now,
            update_date: now,
            is_delete: 0,
            timestamp: ts,
        },
        {
            _id: FIXTURES.articleOther.id,
            title: FIXTURES.articleOther.title,
            content: FIXTURES.articleOther.content,
            html: FIXTURES.articleOther.html,
            toc: '',
            category: FIXTURES.category.id,
            category_name: FIXTURES.category.name,
            visit: 0,
            like: 0,
            comment_count: 0,
            creat_date: now,
            update_date: now,
            is_delete: 0,
            timestamp: ts,
        },
    ])

    await sqliteDb.insert(comments).values({
        _id: FIXTURES.comment.id,
        article_id: FIXTURES.article.id,
        userid: FIXTURES.user.id,
        content: FIXTURES.comment.content,
        creat_date: now,
        is_delete: 0,
        timestamp: ts,
    })

    await sqliteDb.insert(genealogy).values([
        {
            id: 1,
            name: FIXTURES.genealogy.rootName,
            parent: 0,
            sex: '男',
            desc: '根节点',
            parent_name: null,
        },
        {
            id: 2,
            name: FIXTURES.genealogy.childName,
            parent: 1,
            sex: '女',
            desc: '有子辈',
            parent_name: FIXTURES.genealogy.rootName,
        },
        {
            id: 3,
            name: FIXTURES.genealogy.leafName,
            parent: 1,
            sex: '男',
            desc: '可删除',
            parent_name: FIXTURES.genealogy.rootName,
        },
    ])
}
