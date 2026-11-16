import { and, count, eq } from 'drizzle-orm'

import { articleLikes, articles, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getNowTime } from '~/utils'
import { decrement, increment } from '~/utils/drizzle-helpers'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'
import { throwAsApiError } from '~/utils/service-error'

/**
 * 前台点赞业务（Drizzle）。
 */
export class FrontendLikeService {
    /**
     * 文章点赞。重复点赞不会重复增加计数。
     */
    public static async like(reqQuery: { id: string }, user_id?: string) {
        if (!user_id)
            throw new ApiError(API_CODE.VALIDATION, '请先登录')

        const { id: article_id } = reqQuery
        if (!article_id || !isValidObjectId(article_id))
            throw new ApiError(API_CODE.VALIDATION, '参数错误')

        try {
            const [article] = await db.select({ _id: articles._id })
                .from(articles)
                .where(and(eq(articles._id, article_id), eq(articles.is_delete, 0)))
                .limit(1)
            if (!article)
                throw new ApiError(API_CODE.VALIDATION, '没有找到该文章')

            await db.transaction(async (tx) => {
                const [inserted] = await tx.insert(articleLikes).values({
                    _id: generateObjectId(),
                    article_id,
                    user_id,
                    creat_date: getNowTime(),
                    timestamp: Number(getNowTime('X')),
                }).onConflictDoNothing({
                    target: [articleLikes.article_id, articleLikes.user_id],
                }).returning()

                if (!inserted)
                    return

                await tx.update(articles)
                    .set({ like: increment(articles.like) })
                    .where(eq(articles._id, article_id))
            })
            return '操作成功'
        }
        catch (err: unknown) {
            throwAsApiError(err, '文章点赞失败')
        }
    }

    /**
     * 取消文章点赞。没有点赞记录时不扣减计数。
     */
    public static async unlike(reqQuery: { id: string }, user_id?: string) {
        if (!user_id)
            throw new ApiError(API_CODE.VALIDATION, '请先登录')

        const { id: article_id } = reqQuery
        if (!article_id || !isValidObjectId(article_id))
            throw new ApiError(API_CODE.VALIDATION, '参数错误')

        try {
            await db.transaction(async (tx) => {
                const [removed] = await tx.delete(articleLikes)
                    .where(and(
                        eq(articleLikes.article_id, article_id),
                        eq(articleLikes.user_id, user_id),
                    ))
                    .returning()
                if (!removed)
                    return

                await tx.update(articles)
                    .set({ like: decrement(articles.like) })
                    .where(eq(articles._id, article_id))
            })
            return '操作成功'
        }
        catch (err: unknown) {
            throwAsApiError(err, '取消点赞失败')
        }
    }

    /**
     * 按点赞记录重算全部文章的点赞数。
     */
    public static async resetLike() {
        try {
            const allArticles = await db.select({ _id: articles._id }).from(articles)
            for (const item of allArticles) {
                const [likeCount] = await db.select({ value: count() })
                    .from(articleLikes)
                    .where(eq(articleLikes.article_id, item._id))
                await db.update(articles)
                    .set({ like: Number(likeCount?.value) ?? 0 })
                    .where(eq(articles._id, item._id))
            }
            return '操作成功'
        }
        catch (err: unknown) {
            throwAsApiError(err, '重置点赞数失败')
        }
    }
}
