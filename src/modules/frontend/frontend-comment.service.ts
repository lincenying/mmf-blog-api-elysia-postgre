import type { Comment } from '~/types/comment.types'
import type { ReqListQuery } from '~/types/global.types'

import { and, count, desc, eq, type SQL } from 'drizzle-orm'

import { articles, comments, db, users } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage, getNowTime } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { decrement, increment } from '~/utils/drizzle-helpers'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'

/**
 * 将评论行映射为含 populate 用户信息的响应格式。
 */
function mapCommentRow(row: {
    comment: typeof comments.$inferSelect
    user_id: string | null
    email: string | null
    username: string | null
}) {
    const mapped = withVirtualId(row.comment)
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
 * 前台评论业务（Drizzle）。
 */
export class FrontendCommentService {
    /**
     * 发布评论。
     */
    public static async insert(reqBody: { id: string, content: string }, userid?: string) {
        const { id: _id, content } = reqBody

        const creat_date = getNowTime()
        const timestamp = getNowTime('X')
        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }
        else if (!content) {
            throw new ApiError(API_CODE.VALIDATION, '请输入评论内容')
        }
        else if (!userid) {
            throw new ApiError(API_CODE.VALIDATION, '请先登录')
        }
        else {
            const _commentId = generateObjectId()
            const data: Comment = {
                _id: _commentId,
                article_id: _id,
                userid,
                content,
                creat_date,
                is_delete: 0,
                timestamp,
            }
            try {
                const result = await db.transaction(async (tx) => {
                    const [inserted] = await tx.insert(comments).values({
                        _id: _commentId,
                        article_id: data.article_id,
                        userid: data.userid as string,
                        content: data.content,
                        creat_date: data.creat_date,
                        is_delete: data.is_delete,
                        timestamp: Number(data.timestamp),
                    }).returning()
                    await tx.update(articles)
                        .set({ comment_count: increment(articles.comment_count) })
                        .where(eq(articles._id, _id))
                    return inserted
                })
                return withVirtualId(result)
            }
            catch (err: unknown) {
                throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
            }
        }
    }

    /**
     * 前台浏览时，读取评论列表。
     */
    public static async getList(reqQuery: ReqListQuery) {
        const { all, id: article_id } = reqQuery

        let { limit, page } = reqQuery

        if (!article_id || !isValidObjectId(article_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }
        else {
            page = Number(page) || 1
            limit = Number(limit) || 10
            const offset = (page - 1) * limit

            const conditions: SQL[] = [eq(comments.article_id, article_id)]
            if (!all) {
                conditions.push(eq(comments.is_delete, 0))
            }
            const whereClause = and(...conditions)

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
                throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
            }
        }
    }

    /**
     * 评论删除。
     */
    public static async deletes(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        try {
            const [comment] = await db.select().from(comments).where(eq(comments._id, _id)).limit(1)
            if (comment) {
                await db.transaction(async (tx) => {
                    await tx.update(comments).set({ is_delete: 0 }).where(eq(comments._id, _id))
                    await tx.update(articles)
                        .set({ comment_count: decrement(articles.comment_count) })
                        .where(eq(articles._id, comment.article_id))
                })
            }
            return '删除成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 评论恢复。
     */
    public static async recover(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        try {
            const [comment] = await db.select().from(comments).where(eq(comments._id, _id)).limit(1)
            if (comment) {
                await db.transaction(async (tx) => {
                    await tx.update(comments).set({ is_delete: 0 }).where(eq(comments._id, _id))
                    await tx.update(articles)
                        .set({ comment_count: increment(articles.comment_count) })
                        .where(eq(articles._id, comment.article_id))
                })
            }
            return '恢复成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
