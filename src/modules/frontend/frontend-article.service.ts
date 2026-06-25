import type { Article, TrendingData } from '~/types/article.types'
import type { ReqListQuery } from '~/types/global.types'

import { and, count, desc, eq, type SQL } from 'drizzle-orm'

import { articleLikes, articles, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { buildOrderBy, ilikeColumn, increment } from '~/utils/drizzle-helpers'
import { isValidObjectId } from '~/utils/object-id'

function replaceHtmlTag(html: string) {
    return html
        .replace(/<script(.*?)>/gi, '＜script$1＞')
        .replace(/<\/script>/g, '＜/script＞')
        .replace(/\$'/g, '$ \'')
        .replace(/\$`/g, '$ `')
}

function removeFields(fields: string, filter: string) {
    const fieldsArray = fields.split(' ')
    const filterArray = filter.split(',')
    const filteredFields = fieldsArray.filter(field => !filterArray.includes(field))
    return filteredFields.join(' ')
}

/**
 * 查询用户已点赞的文章 ID 集合。
 */
async function getUserLikedArticleIds(userId: string): Promise<Set<string>> {
    const rows = await db.select({ article_id: articleLikes.article_id })
        .from(articleLikes)
        .where(eq(articleLikes.user_id, userId))
    return new Set(rows.map(r => r.article_id))
}

/**
 * 前台文章业务（Drizzle）。
 */
export class FrontendArticleService {
    /**
     * 前台浏览时，获取文章列表。
     */
    public static async getList(reqQuery: ReqListQuery, user_id?: string) {
        const { by, id, key, filter } = reqQuery

        const page = Number(reqQuery.page) || 1
        const limit = Number(reqQuery.limit) || 10
        const offset = (page - 1) * limit

        const conditions: SQL[] = [eq(articles.is_delete, 0)]
        if (id) {
            conditions.push(eq(articles.category, id))
        }
        if (key) {
            conditions.push(ilikeColumn(articles.title, key))
        }
        const whereClause = and(...conditions)

        let sort = '-update_date'
        if (by) {
            sort = `-${by}`
        }

        let filds = 'title content category category_name visit like likes comment_count creat_date update_date is_delete timestamp' // 列表不返回 html
        if (filter) {
            filds = removeFields(filds, filter)
        }
        void filds

        try {
            const likedSet = user_id ? await getUserLikedArticleIds(user_id) : new Set<string>()

            const [list, totalResult] = await Promise.all([
                db.select({
                    _id: articles._id,
                    title: articles.title,
                    content: articles.content,
                    toc: articles.toc,
                    category: articles.category,
                    category_name: articles.category_name,
                    visit: articles.visit,
                    like: articles.like,
                    comment_count: articles.comment_count,
                    creat_date: articles.creat_date,
                    update_date: articles.update_date,
                    is_delete: articles.is_delete,
                    timestamp: articles.timestamp,
                }).from(articles).where(whereClause).orderBy(buildOrderBy(articles, sort)).limit(limit).offset(offset),
                db.select({ value: count() }).from(articles).where(whereClause),
            ])
            const total = Number(totalResult[0]?.value) ?? 0
            const totalPage = Math.ceil(total / limit)

            const tmpList = list.map((item) => {
                const mapped = withVirtualId({ ...item, likes: [] as string[], timestamp: item.timestamp ?? 0 })
                return {
                    ...mapped,
                    like_status: user_id ? likedSet.has(item._id) : false,
                    content: `${replaceHtmlTag(item.content).substring(0, 500)}...`,
                    likes: [] as string[],
                } satisfies Omit<Article, 'html'>
            })

            return {
                list: tmpList,
                total,
                hasNext: totalPage > page ? 1 : 0,
                hasPrev: page > 1 ? 1 : 0,
            }
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 前台浏览时，获取单篇文章。
     */
    public static async getItem(reqQuery: { id: string }, user_id: Nullable<string>) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [result] = await db.select().from(articles).where(and(eq(articles._id, _id), eq(articles.is_delete, 0))).limit(1)

            if (!result) {
                throw new ApiError(API_CODE.VALIDATION, '没有找到该文章')
            }

            await db.update(articles)
                .set({ visit: increment(articles.visit) })
                .where(eq(articles._id, _id))

            const likedSet = user_id ? await getUserLikedArticleIds(user_id) : new Set<string>()
            const mapped = withVirtualId({ ...result, likes: [] as string[], timestamp: result.timestamp ?? 0 }) as Article
            mapped.like_status = user_id ? likedSet.has(_id) : false
            mapped.likes = []
            mapped.content = replaceHtmlTag(mapped.content)
            mapped.html = replaceHtmlTag(mapped.html)
            return mapped
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 前台浏览时，获取文章推荐列表。
     */
    public static async getTrending(reqQuery: { id?: string }) {
        const id = reqQuery.id

        try {
            let category: string | undefined
            if (id) {
                const [article] = await db.select({ category: articles.category })
                    .from(articles)
                    .where(and(eq(articles._id, id), eq(articles.is_delete, 0)))
                    .limit(1)
                category = article?.category
            }

            const limit = 5
            const conditions: SQL[] = [eq(articles.is_delete, 0)]
            if (category) {
                conditions.push(eq(articles.category, category))
            }
            const data: TrendingData = { is_delete: 0, category }

            void data

            const result = await db.select({
                _id: articles._id,
                title: articles.title,
                visit: articles.visit,
                like: articles.like,
                comment_count: articles.comment_count,
            })
                .from(articles)
                .where(and(...conditions))
                .orderBy(desc(articles.visit))
                .limit(limit)

            return {
                list: result.map(row => withVirtualId({ ...row, likes: [] })),
            }
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
