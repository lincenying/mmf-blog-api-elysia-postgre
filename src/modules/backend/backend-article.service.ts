import type { ArticleInsert, ArticleModify, ArticlePage } from '~/schema/elysia-schema'

import { and, count, eq, type SQL } from 'drizzle-orm'
import hljs from 'highlight.js'
import markdownIt from 'markdown-it'

import { articles, categories, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage, getNowTime } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { buildOrderBy, decrement, ilikeColumn, increment } from '~/utils/drizzle-helpers'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'

/**
 * 后台文章业务（Drizzle）。
 */
export class BackendArticleService {
    /**
     * 将 Markdown 格式的内容转换成 HTML 格式，并生成目录（TOC）。
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
        const page = Number(reqQuery.page) || 1
        const limit = Number(reqQuery.limit) || 15
        const offset = (page - 1) * limit
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
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
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
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 新增文章。
     */
    public static async insert(reqBody: ArticleInsert) {
        const { category, content, title, html } = reqBody

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

        const arr_category = category.split('|')
        const data = {
            _id: generateObjectId(),
            title,
            category: arr_category[0],
            category_name: arr_category[1],
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
        try {
            const result = await db.transaction(async (tx) => {
                const [inserted] = await tx.insert(articles).values(data).returning()
                await tx.update(categories).set({ cate_num: increment(categories.cate_num) }).where(eq(categories._id, arr_category[0]))
                return inserted
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 删除文章并更新分类计数。
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
                    .where(eq(articles._id, _id))
                    .returning()
                if (!updated) {
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')
                }
                await tx.update(categories)
                    .set({ cate_num: decrement(categories.cate_num) })
                    .where(eq(categories._id, updated.category))
                return updated
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 恢复已删除文章。
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
                    .where(eq(articles._id, _id))
                    .returning()
                if (!updated) {
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')
                }
                await tx.update(categories)
                    .set({ cate_num: increment(categories.cate_num) })
                    .where(eq(categories._id, updated.category))
                return updated
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 修改文章信息。
     */
    public static async modify(reqBody: ArticleModify) {
        const { id: _id, category, category_old, content, title, html, category_name } = reqBody

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

        try {
            const result = await db.transaction(async (tx) => {
                const data = {
                    title,
                    category,
                    category_name,
                    content,
                    html: mdHtml,
                    toc: mdToc,
                    update_date: getNowTime(),
                }
                const [updated] = await tx.update(articles)
                    .set(data)
                    .where(eq(articles._id, _id))
                    .returning()

                if (!updated) {
                    throw new ApiError(API_CODE.VALIDATION, '文章不存在')
                }

                if (category !== category_old) {
                    await Promise.all([
                        tx.update(categories)
                            .set({ cate_num: increment(categories.cate_num) })
                            .where(eq(categories._id, category)),
                        tx.update(categories)
                            .set({ cate_num: decrement(categories.cate_num) })
                            .where(eq(categories._id, category_old)),
                    ])
                }
                return updated
            })
            return withVirtualId({ ...result, likes: [] })
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
