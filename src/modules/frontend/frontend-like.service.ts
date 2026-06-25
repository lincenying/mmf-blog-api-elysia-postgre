import { and, count, eq } from 'drizzle-orm'

import { articleLikes, articles, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage } from '~/utils'
import { decrement, increment } from '~/utils/drizzle-helpers'
import { isValidObjectId } from '~/utils/object-id'

/**
 * 前台点赞业务（Drizzle）。
 */
export class FrontendLikeService {
    /**
     * 文章点赞。
     */
    public static async like(reqQuery: { id: string }, user_id?: string) {
        if (!user_id) {
            throw new ApiError(API_CODE.VALIDATION, '请先登录')
        }

        const { id: article_id } = reqQuery

        if (!article_id || !isValidObjectId(article_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [result] = await db.select().from(articles).where(and(eq(articles._id, article_id), eq(articles.is_delete, 0))).limit(1)

            if (result) {
                const [existing] = await db.select().from(articleLikes).where(and(
                    eq(articleLikes.article_id, article_id),
                    eq(articleLikes.user_id, user_id),
                )).limit(1)

                if (!existing) {
                    await db.transaction(async (tx) => {
                        await tx.insert(articleLikes).values({
                            article_id,
                            user_id,
                        })
                        await tx.update(articles)
                            .set({ like: increment(articles.like) })
                            .where(eq(articles._id, article_id))
                    })
                }
            }
            return '操作成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 取消文章点赞。
     */
    public static async unlike(reqQuery: { id: string }, user_id?: string) {
        if (!user_id) {
            throw new ApiError(API_CODE.VALIDATION, '请先登录')
        }

        const { id: article_id } = reqQuery

        if (!article_id || !isValidObjectId(article_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [existing] = await db.select().from(articleLikes).where(and(
                eq(articleLikes.article_id, article_id),
                eq(articleLikes.user_id, user_id),
            )).limit(1)

            if (existing) {
                await db.transaction(async (tx) => {
                    await tx.delete(articleLikes)
                        .where(and(
                            eq(articleLikes.article_id, article_id),
                            eq(articleLikes.user_id, user_id),
                        ))
                    await tx.update(articles)
                        .set({ like: decrement(articles.like) })
                        .where(eq(articles._id, article_id))
                })
            }
            return '操作成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 重置文章点赞数量。
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
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
