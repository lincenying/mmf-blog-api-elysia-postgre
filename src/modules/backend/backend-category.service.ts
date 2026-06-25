import type { CategoryInsert, CategoryModify } from '~/schema/elysia-schema'

import { desc, eq } from 'drizzle-orm'

import { categories, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage, getNowTime } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'

/**
 * 后台分类业务（Drizzle）。
 */
export class BackendCategoryService {
    /**
     * 管理时，获取分类列表。
     */
    public static async getList() {
        try {
            const result = await db.select().from(categories).orderBy(desc(categories.cate_order))
            return {
                list: result.map(withVirtualId),
            }
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理时，获取分类详情。
     */
    public static async getItem(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [result] = await db.select().from(categories).where(eq(categories._id, _id)).limit(1)
            return result ? withVirtualId(result) : null
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理时，新增分类。
     */
    public static async insert(reqBody: CategoryInsert) {
        const { cate_name, cate_order } = reqBody

        if (!cate_name || !cate_order) {
            throw new ApiError(API_CODE.VALIDATION, '请填写分类名称和排序')
        }

        try {
            const _id = generateObjectId()
            const creatData = {
                _id,
                cate_name,
                cate_order,
                cate_num: 0,
                creat_date: getNowTime(),
                update_date: getNowTime(),
                is_delete: 0,
                timestamp: Number(getNowTime('X')),
            }
            const [result] = await db.insert(categories).values(creatData).returning()
            return withVirtualId(result)
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理时，删除分类。
     */
    public static async deletes(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            await db.update(categories).set({ is_delete: 1 }).where(eq(categories._id, _id))
            return '删除成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理时，恢复分类。
     */
    public static async recover(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            await db.update(categories).set({ is_delete: 0 }).where(eq(categories._id, _id))
            return '恢复成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理时，编辑分类。
     */
    public static async modify(reqBody: CategoryModify) {
        const { id: _id, cate_name, cate_order } = reqBody

        try {
            const [result] = await db.update(categories)
                .set({
                    cate_name,
                    cate_order,
                    update_date: getNowTime(),
                })
                .where(eq(categories._id, _id))
                .returning()
            return result ? withVirtualId(result) : null
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
