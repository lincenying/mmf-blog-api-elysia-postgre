import type { ArticleSearch } from '~/schema/elysia-schema'
import type { Article } from '~/types/article.types'

import { and, count, desc, eq, ne, type SQL } from 'drizzle-orm'

import { articleLikes, articles, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { withVirtualId } from '~/utils/db-mapper'
import { buildOrderBy, ilikeColumn, increment } from '~/utils/drizzle-helpers'
import { replaceHtmlTag } from '~/utils/html-text'
import { isValidObjectId } from '~/utils/object-id'
import { normalizePage } from '~/utils/page'
import { throwAsApiError } from '~/utils/service-error'

/** 前台文章列表允许的排序字段。 */
const ARTICLE_SORT_FIELDS = new Set(['update_date', 'creat_date', 'visit', 'like', 'comment_count', 'timestamp'])

/**
 * 查询用户已点赞的文章 ID 集合。
 */
async function getUserLikedArticleIds(userId: string): Promise<Set<string>> {
    const rows = await db.select({ article_id: articleLikes.article_id }).from(articleLikes).where(eq(articleLikes.user_id, userId))
    return new Set(rows.map(row => row.article_id))
}

/**
 * 查询用户是否点赞了指定文章。
 */
async function hasUserLikedArticle(userId: string, articleId: string) {
    const [row] = await db.select({ article_id: articleLikes.article_id })
        .from(articleLikes)
        .where(and(eq(articleLikes.user_id, userId), eq(articleLikes.article_id, articleId)))
        .limit(1)
    return !!row
}

/**
 * 前台文章业务（Drizzle）。
 */
export class FrontendArticleService {
    /**
     * 前台浏览时，获取文章列表。
     */
    public static async getList(reqQuery: ArticleSearch, user_id?: string) {
        const { by, id, key } = reqQuery
        const { page, limit, offset } = normalizePage(reqQuery.page, reqQuery.limit, 10)

        const conditions: SQL[] = [eq(articles.is_delete, 0)]
        if (id && isValidObjectId(id))
            conditions.push(eq(articles.category, id))
        if (key)
            conditions.push(ilikeColumn(articles.title, key))
        const whereClause = and(...conditions)
        const sortField = by && ARTICLE_SORT_FIELDS.has(by) ? by : 'update_date'

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
                }).from(articles).where(whereClause).orderBy(buildOrderBy(articles, `-${sortField}`)).limit(limit).offset(offset),
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
            throwAsApiError(err, '获取文章列表失败')
        }
    }

    /**
     * 前台浏览时，获取单篇文章，并增加访问数。
     */
    public static async getItem(reqQuery: { id: string }, user_id: string) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id))
            throw new ApiError(API_CODE.VALIDATION, '参数错误')

        try {
            const [result] = await db.select().from(articles).where(and(eq(articles._id, _id), eq(articles.is_delete, 0))).limit(1)

            if (!result)
                throw new ApiError(API_CODE.VALIDATION, '没有找到该文章')

            await db.update(articles)
                .set({ visit: increment(articles.visit) })
                .where(eq(articles._id, _id))

            const mapped = withVirtualId({ ...result, likes: [] as string[], timestamp: result.timestamp ?? 0 }) as Article
            mapped.visit = (result.visit ?? 0) + 1
            mapped.like_status = user_id ? await hasUserLikedArticle(user_id, _id) : false
            mapped.likes = []
            mapped.content = replaceHtmlTag(mapped.content)
            mapped.html = replaceHtmlTag(mapped.html)
            return mapped
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取文章详情失败')
        }
    }

    /**
     * 前台浏览时，获取文章推荐列表。传入文章 ID 时排除该文，并优先返回同分类。
     */
    public static async getTrending(reqQuery: { id?: string }) {
        const id = reqQuery.id

        try {
            const conditions: SQL[] = [eq(articles.is_delete, 0)]
            if (id && isValidObjectId(id)) {
                conditions.push(ne(articles._id, id))
                const [article] = await db.select({ category: articles.category })
                    .from(articles)
                    .where(and(eq(articles._id, id), eq(articles.is_delete, 0)))
                    .limit(1)
                if (article?.category)
                    conditions.push(eq(articles.category, article.category))
            }

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
                .limit(5)

            return {
                list: result.map(row => withVirtualId({ ...row, likes: [] })),
            }
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取推荐文章失败')
        }
    }
}
