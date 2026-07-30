import { and, eq } from 'drizzle-orm'
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

/**
 * 按主键查询文章。
 */
export async function findArticle(id: string) {
    const [row] = await sqliteDb.select().from(articles).where(eq(articles._id, id)).limit(1)
    return row ?? null
}

/**
 * 按主键查询分类。
 */
export async function findCategory(id: string) {
    const [row] = await sqliteDb.select().from(categories).where(eq(categories._id, id)).limit(1)
    return row ?? null
}

/**
 * 按主键查询评论。
 */
export async function findComment(id: string) {
    const [row] = await sqliteDb.select().from(comments).where(eq(comments._id, id)).limit(1)
    return row ?? null
}

/**
 * 按用户名查询前台用户。
 */
export async function findUserByUsername(username: string) {
    const [row] = await sqliteDb.select().from(users).where(eq(users.username, username)).limit(1)
    return row ?? null
}

/**
 * 按主键查询前台用户。
 */
export async function findUser(id: string) {
    const [row] = await sqliteDb.select().from(users).where(eq(users._id, id)).limit(1)
    return row ?? null
}

/**
 * 按主键查询管理员。
 */
export async function findAdmin(id: string) {
    const [row] = await sqliteDb.select().from(admins).where(eq(admins._id, id)).limit(1)
    return row ?? null
}

/**
 * 查询用户对某文章的点赞记录。
 */
export async function findArticleLike(articleId: string, userId: string) {
    const [row] = await sqliteDb.select().from(articleLikes).where(and(
        eq(articleLikes.article_id, articleId),
        eq(articleLikes.user_id, userId),
    )).limit(1)
    return row ?? null
}

/**
 * 统计某文章的点赞记录数。
 */
export async function countArticleLikes(articleId: string) {
    const rows = await sqliteDb.select().from(articleLikes).where(eq(articleLikes.article_id, articleId))
    return rows.length
}

/**
 * 按主键查询族谱成员。
 */
export async function findGenealogy(id: number) {
    const [row] = await sqliteDb.select().from(genealogy).where(eq(genealogy.id, id)).limit(1)
    return row ?? null
}

/**
 * 计算与业务一致的加盐 MD5 密码。
 */
export function hashPassword(plain: string) {
    return md5(config.md5_salt + plain)
}
