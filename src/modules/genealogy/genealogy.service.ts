import type { GenealogyInsert, GenealogyModify } from '~/schema/elysia-schema'

import { asc, eq } from 'drizzle-orm'

import { db, genealogy } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage } from '~/utils'

/**
 * 族谱业务（列表公开；增删改由 Controller 层管理员守卫保护）。
 */
export class GenealogyService {
    /**
     * 获取全部族谱成员（按 id 升序）。
     */
    public static async getList() {
        try {
            return await db.select().from(genealogy).orderBy(asc(genealogy.id))
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 校验当前管理员会话是否有效（供前端探测登录态）。
     */
    public static authOk() {
        return { ok: true }
    }

    /**
     * 根据 parent id 解析 parent_name；parent 为 0 时返回空。
     */
    private static async resolveParentName(parent: number) {
        if (parent === 0) {
            return null
        }

        const [parentRow] = await db.select().from(genealogy).where(eq(genealogy.id, parent)).limit(1)
        if (!parentRow) {
            throw new ApiError(API_CODE.VALIDATION, '父辈不存在')
        }
        return parentRow.name
    }

    /**
     * 检测将 parent 设为 targetParent 是否会形成环（含自身）。
     */
    private static async wouldCreateCycle(id: number, targetParent: number) {
        if (targetParent === 0) {
            return false
        }
        if (targetParent === id) {
            return true
        }

        let current = targetParent
        const visited = new Set<number>()
        while (current !== 0) {
            if (current === id) {
                return true
            }
            if (visited.has(current)) {
                return true
            }
            visited.add(current)
            const [row] = await db.select({ parent: genealogy.parent }).from(genealogy).where(eq(genealogy.id, current)).limit(1)
            if (!row) {
                break
            }
            current = row.parent
        }
        return false
    }

    /**
     * 新增族谱成员。
     */
    public static async insert(body: GenealogyInsert) {
        const name = body.name.trim()
        const parent = body.parent
        const sex = body.sex?.trim() || null
        const desc = body.desc?.trim() || null

        if (!name) {
            throw new ApiError(API_CODE.VALIDATION, '请输入姓名')
        }
        if (!Number.isInteger(parent) || parent < 0) {
            throw new ApiError(API_CODE.VALIDATION, '父辈参数错误')
        }

        try {
            const parent_name = await this.resolveParentName(parent)
            const [result] = await db.insert(genealogy).values({
                name,
                parent,
                sex,
                desc,
                parent_name,
            }).returning()
            return result
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 更新族谱成员。
     */
    public static async modify(id: number, body: GenealogyModify) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new ApiError(API_CODE.VALIDATION, 'ID 参数错误')
        }

        const name = body.name.trim()
        const parent = body.parent
        const sex = body.sex?.trim() || null
        const desc = body.desc?.trim() || null

        if (!name) {
            throw new ApiError(API_CODE.VALIDATION, '请输入姓名')
        }
        if (!Number.isInteger(parent) || parent < 0) {
            throw new ApiError(API_CODE.VALIDATION, '父辈参数错误')
        }

        try {
            const [existing] = await db.select().from(genealogy).where(eq(genealogy.id, id)).limit(1)
            if (!existing) {
                throw new ApiError(API_CODE.NOT_FOUND, '成员不存在')
            }

            if (await this.wouldCreateCycle(id, parent)) {
                throw new ApiError(API_CODE.VALIDATION, '不能将父辈设为自身或其后代')
            }

            const parent_name = await this.resolveParentName(parent)
            const [result] = await db.update(genealogy).set({
                name,
                parent,
                sex,
                desc,
                parent_name,
            }).where(eq(genealogy.id, id)).returning()
            return result
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 删除族谱成员（存在子辈时拒绝）。
     */
    public static async deletes(id: number) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new ApiError(API_CODE.VALIDATION, 'ID 参数错误')
        }

        try {
            const [existing] = await db.select().from(genealogy).where(eq(genealogy.id, id)).limit(1)
            if (!existing) {
                throw new ApiError(API_CODE.NOT_FOUND, '成员不存在')
            }

            const [child] = await db.select({ id: genealogy.id }).from(genealogy).where(eq(genealogy.parent, id)).limit(1)
            if (child) {
                throw new ApiError(API_CODE.VALIDATION, '存在子辈，无法删除')
            }

            await db.delete(genealogy).where(eq(genealogy.id, id))
            return '删除成功'
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
