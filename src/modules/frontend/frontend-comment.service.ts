import type { CommentListQuery } from '~/schema/elysia-schema'

import { and, count, desc, eq } from 'drizzle-orm'

import { articles, comments, db, users } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getNowTime } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { decrement, increment } from '~/utils/drizzle-helpers'
import { replaceHtmlTag } from '~/utils/html-text'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'
import { normalizePage } from '~/utils/page'
import { throwAsApiError } from '~/utils/service-error'

/**
 * 将评论行映射为含用户信息的响应，并转义内容中的脚本片段。
 */
function mapCommentRow(row: {
    comment: typeof comments.$inferSelect
    user_id: string | null
    email: string | null
    username: string | null
}) {
    const mapped = withVirtualId({
        ...row.comment,
        content: replaceHtmlTag(row.comment.content),
    })
    if (row.user_id) {
        return {
            ...mapped,
            userid: {
                _id: row.user_id,
                id: row.user_id,
                email: row.email ?? '',
                username: row.username ?? '',
            },
        }
    }
    return mapped
}

/**
 * 切换评论删除状态。只有状态真正变化时才调整文章评论数。
 */
async function setCommentDeleted(id: string, deleted: boolean) {
    if (!id || !isValidObjectId(id))
        throw new ApiError(API_CODE.VALIDATION, '参数错误')

    const next = deleted ? 1 : 0
    const previous = deleted ? 0 : 1

    try {
        await db.transaction(async (tx) => {
            const [updated] = await tx.update(comments)
                .set({ is_delete: next })
                .where(and(eq(comments._id, id), eq(comments.is_delete, previous)))
                .returning()
            if (updated) {
                await tx.update(articles)
                    .set({
                        comment_count: deleted
                            ? decrement(articles.comment_count)
                            : increment(articles.comment_count),
                    })
                    .where(eq(articles._id, updated.article_id))
                return
            }

            const [current] = await tx.select({ _id: comments._id }).from(comments).where(eq(comments._id, id)).limit(1)
            if (!current)
                throw new ApiError(API_CODE.VALIDATION, '评论不存在')
        })
        return deleted ? '删除成功' : '恢复成功'
    }
    catch (err: unknown) {
        throwAsApiError(err, deleted ? '删除评论失败' : '恢复评论失败')
    }
}

/**
 * 前台评论业务（Drizzle）。
 */
export class FrontendCommentService {
    /**
     * 发布评论。文章必须存在且未删除。
     */
    public static async insert(reqBody: { id: string, content: string }, userid?: string) {
        const { id: _id, content } = reqBody
        const text = content.trim()

        if (!_id || !isValidObjectId(_id))
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        if (!text)
            throw new ApiError(API_CODE.VALIDATION, '请输入评论内容')
        if (!userid)
            throw new ApiError(API_CODE.VALIDATION, '请先登录')

        const data = {
            _id: generateObjectId(),
            article_id: _id,
            userid,
            content: replaceHtmlTag(text),
            creat_date: getNowTime(),
            is_delete: 0,
            timestamp: Number(getNowTime('X')),
        }

        try {
            const result = await db.transaction(async (tx) => {
                const [article] = await tx.select({ _id: articles._id })
                    .from(articles)
                    .where(and(eq(articles._id, _id), eq(articles.is_delete, 0)))
                    .limit(1)
                if (!article)
                    throw new ApiError(API_CODE.VALIDATION, '没有找到该文章')

                const [inserted] = await tx.insert(comments).values(data).returning()
                await tx.update(articles)
                    .set({ comment_count: increment(articles.comment_count) })
                    .where(eq(articles._id, _id))
                return inserted
            })
            return withVirtualId(result)
        }
        catch (err: unknown) {
            throwAsApiError(err, '发布评论失败')
        }
    }

    /**
     * 前台浏览时，读取未删除的评论列表。
     */
    public static async getList(reqQuery: CommentListQuery) {
        const { id: article_id } = reqQuery
        const { page, limit, offset } = normalizePage(reqQuery.page, reqQuery.limit, 10)

        if (!article_id || !isValidObjectId(article_id))
            throw new ApiError(API_CODE.VALIDATION, '参数错误')

        const whereClause = and(eq(comments.article_id, article_id), eq(comments.is_delete, 0))

        try {
            const [list, totalResult] = await Promise.all([
                db.select({
                    comment: comments,
                    user_id: users._id,
                    email: users.email,
                    username: users.username,
                })
                    .from(comments)
                    .leftJoin(users, eq(comments.userid, users._id))
                    .where(whereClause)
                    .orderBy(desc(comments._id))
                    .limit(limit)
                    .offset(offset),
                db.select({ value: count() }).from(comments).where(whereClause),
            ])
            const total = Number(totalResult[0]?.value) ?? 0
            const totalPage = Math.ceil(total / limit)
            return {
                list: list.map(mapCommentRow),
                total,
                hasNext: totalPage > page ? 1 : 0,
                hasPrev: page > 1 ? 1 : 0,
            }
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取评论列表失败')
        }
    }

    /**
     * 评论删除。
     */
    public static async deletes(reqQuery: { id: string }) {
        return await setCommentDeleted(reqQuery.id, true)
    }

    /**
     * 评论恢复。
     */
    public static async recover(reqQuery: { id: string }) {
        return await setCommentDeleted(reqQuery.id, false)
    }
}
