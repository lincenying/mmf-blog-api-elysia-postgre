import type { ArticleInsert, ArticleModify, ArticlePage } from '~/schema/elysia-schema'

import { and, count, eq, type SQL } from 'drizzle-orm'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'

import { articles, categories, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getNowTime } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { buildOrderBy, decrement, ilikeColumn, increment } from '~/utils/drizzle-helpers'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'
import { normalizePage } from '~/utils/page'
import { throwAsApiError } from '~/utils/service-error'

/**
 * 从 `分类ID|分类名` 中取出分类 ID。没有分隔符时整段视为 ID。
 */
function parseCategoryId(category: string) {
    const separator = category.indexOf('|')
    return separator === -1 ? category : category.slice(0, separator)
}

/**
 * 读取未删除的分类。不存在或已删除时抛出校验错误。
 */
async function requireActiveCategory(categoryId: string) {
    if (!isValidObjectId(categoryId))
        throw new ApiError(API_CODE.VALIDATION, '分类不存在')

    const [category] = await db.select().from(categories).where(eq(categories._id, categoryId)).limit(1)
    if (!category || category.is_delete !== 0)
        throw new ApiError(API_CODE.VALIDATION, '分类不存在')

    return category
}

/**
 * 后台文章业务（Drizzle）。
 */
export class BackendArticleService {
    /**
     * 将 Markdown 转换成 HTML。目录保持为空，与现有文章存储格式一致。
     */
    public static marked(content: string) {
        const $return = {
            html: '',
            toc: '',
        }

        const html = markdownIt({
            breaks: true,
            html: true,
            linkify: true,
            typographer: true,
            highlight(str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(str, { language: lang }).value
                    }
                    catch (_error) {}
                }
                return ''
            },
        }).render(content)

        $return.html = html

        return $return
    }

    /**
     * 获取文章列表。
     */
    public static async getList(reqQuery: ArticlePage) {
        const sort = reqQuery.sort || '-update_date'
        const { page, limit, offset } = normalizePage(reqQuery.page, reqQuery.limit, 15)
        const key = reqQuery.key || ''

        const conditions: SQL[] = []
        if (key) {
            conditions.push(ilikeColumn(articles.title, key))
        }
        const whereClause = conditions.length ? and(...conditions) : undefined

        try {
            const [list, totalResult] = await Promise.all([
                db.select().from(articles).where(whereClause).orderBy(buildOrderBy(articles, sort)).limit(limit).offset(offset),
                db.select({ value: count() }).from(articles).where(whereClause),
            ])
            const total = Number(totalResult[0]?.value) ?? 0
            const totalPage = Math.ceil(total / limit)
            return {
                list: list.map(row => withVirtualId({ ...row, likes: [] })),
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
     * 获取指定 ID 的文章。
     */
    public static async getItem(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [result] = await db.select().from(articles).where(eq(articles._id, _id)).limit(1)
            return result ? withVirtualId({ ...result, likes: [] }) : null
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取文章详情失败')
        }
    }

    /**
     * 新增文章。分类以数据库中的未删除分类为准。
     */
    public static async insert(reqBody: ArticleInsert) {
        const { category, content, title, html } = reqBody

        try {
            const categoryRow = await requireActiveCategory(parseCategoryId(category))

            let mdHtml: string, mdToc: string
            if (html) {
                mdHtml = html
                mdToc = ''
            }
            else {
                const md = this.marked(content)
                mdToc = md.toc
                mdHtml = md.html
            }

            const data = {
                _id: generateObjectId(),
                title,
                category: categoryRow._id,
                category_name: categoryRow.cate_name,
                content,
                html: mdHtml,
                toc: mdToc,
                visit: 0,
                like: 0,
                comment_count: 0,
                creat_date: getNowTime(),
                update_date: getNowTime(),
                is_delete: 0,
                timestamp: Number(getNowTime('X')),
            }
            const result = await db.transaction(async (tx) => {
                const [inserted] = await tx.insert(articles).values(data).returning()
                await tx.update(categories).set({ cate_num: increment(categories.cate_num) }).where(eq(categories._id, categoryRow._id))
                return inserted
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            throwAsApiError(err, '新增文章失败')
        }
    }

    /**
     * 删除文章并更新分类计数。重复删除不再扣减计数。
     */
    public static async deletes(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const result = await db.transaction(async (tx) => {
                const [updated] = await tx.update(articles)
                    .set({ is_delete: 1 })
                    .where(and(eq(articles._id, _id), eq(articles.is_delete, 0)))
                    .returning()
                if (updated) {
                    await tx.update(categories)
                        .set({ cate_num: decrement(categories.cate_num) })
                        .where(eq(categories._id, updated.category))
                    return updated
                }

                const [current] = await tx.select().from(articles).where(eq(articles._id, _id)).limit(1)
                if (!current)
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')
                return current
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            throwAsApiError(err, '删除文章失败')
        }
    }

    /**
     * 恢复已删除文章。重复恢复不再增加分类计数。
     */
    public static async recover(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const result = await db.transaction(async (tx) => {
                const [updated] = await tx.update(articles)
                    .set({ is_delete: 0 })
                    .where(and(eq(articles._id, _id), eq(articles.is_delete, 1)))
                    .returning()
                if (updated) {
                    await tx.update(categories)
                        .set({ cate_num: increment(categories.cate_num) })
                        .where(eq(categories._id, updated.category))
                    return updated
                }

                const [current] = await tx.select().from(articles).where(eq(articles._id, _id)).limit(1)
                if (!current)
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')
                return current
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            throwAsApiError(err, '恢复文章失败')
        }
    }

    /**
     * 修改文章信息。分类计数按数据库里的原分类调整，不使用客户端传入的旧分类。
     */
    public static async modify(reqBody: ArticleModify) {
        const { id: _id, category, content, title, html } = reqBody

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const categoryRow = await requireActiveCategory(category)

            let mdHtml: string, mdToc: string
            if (html) {
                mdHtml = html
                mdToc = ''
            }
            else {
                const md = this.marked(content)
                mdHtml = md.html
                mdToc = md.toc
            }

            const result = await db.transaction(async (tx) => {
                const [current] = await tx.select().from(articles).where(eq(articles._id, _id)).limit(1)
                if (!current)
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')

                const [updated] = await tx.update(articles)
                    .set({
                        title,
                        category: categoryRow._id,
                        category_name: categoryRow.cate_name,
                        content,
                        html: mdHtml,
                        toc: mdToc,
                        update_date: getNowTime(),
                    })
                    .where(eq(articles._id, _id))
                    .returning()

                if (!updated)
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')

                if (current.is_delete === 0 && current.category !== categoryRow._id) {
                    await tx.update(categories)
                        .set({ cate_num: decrement(categories.cate_num) })
                        .where(eq(categories._id, current.category))
                    await tx.update(categories)
                        .set({ cate_num: increment(categories.cate_num) })
                        .where(eq(categories._id, categoryRow._id))
                }
                return updated
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            throwAsApiError(err, '修改文章失败')
        }
    }
}
