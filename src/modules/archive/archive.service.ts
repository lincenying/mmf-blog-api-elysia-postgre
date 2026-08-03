import type { ArchiveInsert, ArchiveModify, ArchivePage } from '~/schema/elysia-schema'

import { count, eq, type SQL } from 'drizzle-orm'

import { archive, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage, getNowTime } from '~/utils'
import { buildOrderBy, ilikeColumn } from '~/utils/drizzle-helpers'

/** 列表查询时排除正文，减轻传输体积。 */
const archiveListColumns = {
    c_id: archive.c_id,
    c_title: archive.c_title,
    c_intro: archive.c_intro,
    c_view: archive.c_view,
    c_posttime: archive.c_posttime,
}

/**
 * 将可选数值字段规范为整数或 null。
 */
function normalizeOptionalInt(value: number | null | undefined, fallback: number | null = null): number | null {
    if (value === undefined || value === null) {
        return fallback
    }
    if (!Number.isFinite(value)) {
        return fallback
    }
    return Math.trunc(value)
}

/**
 * 将可选字符串字段 trim；空串按 null 处理。
 */
function normalizeOptionalText(value: string | null | undefined, fallback: string | null = null): string | null {
    if (value === undefined || value === null) {
        return fallback
    }
    const trimmed = value.trim()
    return trimmed === '' ? fallback : trimmed
}

/**
 * 归档内容业务（列表/详情公开；增删改由 Controller 层管理员守卫保护）。
 */
export class ArchiveService {
    /**
     * 分页获取归档列表（不含正文）。
     */
    public static async getList(reqQuery: ArchivePage) {
        const sort = reqQuery.sort || '-c_id'
        const page = Number(reqQuery.page) || 1
        const limit = Number(reqQuery.limit) || 15
        const offset = (page - 1) * limit
        const key = reqQuery.key?.trim() || ''

        const conditions: SQL[] = []
        if (key) {
            conditions.push(ilikeColumn(archive.c_title, key))
        }
        const whereClause = conditions.length ? conditions[0] : undefined

        try {
            const [list, totalResult] = await Promise.all([
                db.select(archiveListColumns)
                    .from(archive)
                    .where(whereClause)
                    .orderBy(buildOrderBy(archive, sort, 'c_id'))
                    .limit(limit)
                    .offset(offset),
                db.select({ value: count() }).from(archive).where(whereClause),
            ])
            const total = Number(totalResult[0]?.value) ?? 0
            const totalPage = Math.ceil(total / limit)
            return {
                list,
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
     * 获取单条归档详情（含正文）。
     */
    public static async getItem(id: number) {
        if (!Number.isInteger(id) || id < 0) {
            throw new ApiError(API_CODE.VALIDATION, 'ID 参数错误')
        }

        try {
            const [result] = await db.select().from(archive).where(eq(archive.c_id, id)).limit(1)
            if (!result) {
                throw new ApiError(API_CODE.NOT_FOUND, '归档不存在')
            }
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
     * 新增归档。
     */
    public static async insert(body: ArchiveInsert) {
        const c_title = body.c_title.trim()
        if (!c_title) {
            throw new ApiError(API_CODE.VALIDATION, '请输入标题')
        }

        try {
            const [result] = await db.insert(archive).values({
                c_title,
                c_intro: normalizeOptionalText(body.c_intro),
                c_content: normalizeOptionalText(body.c_content, ''),
                c_view: normalizeOptionalInt(body.c_view, 0),
                c_posttime: getNowTime(),
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
     * 更新归档。
     */
    public static async modify(id: number, body: ArchiveModify) {
        if (!Number.isInteger(id) || id < 0) {
            throw new ApiError(API_CODE.VALIDATION, 'ID 参数错误')
        }

        const c_title = body.c_title.trim()
        if (!c_title) {
            throw new ApiError(API_CODE.VALIDATION, '请输入标题')
        }

        try {
            const [existing] = await db.select({ c_id: archive.c_id }).from(archive).where(eq(archive.c_id, id)).limit(1)
            if (!existing) {
                throw new ApiError(API_CODE.NOT_FOUND, '归档不存在')
            }

            const [result] = await db.update(archive).set({
                c_title,
                c_intro: normalizeOptionalText(body.c_intro),
                c_content: normalizeOptionalText(body.c_content, ''),
                c_view: normalizeOptionalInt(body.c_view, 0),
            }).where(eq(archive.c_id, id)).returning()
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
     * 删除归档。
     */
    public static async deletes(id: number) {
        if (!Number.isInteger(id) || id < 0) {
            throw new ApiError(API_CODE.VALIDATION, 'ID 参数错误')
        }

        try {
            const [existing] = await db.select({ c_id: archive.c_id }).from(archive).where(eq(archive.c_id, id)).limit(1)
            if (!existing) {
                throw new ApiError(API_CODE.NOT_FOUND, '归档不存在')
            }

            await db.delete(archive).where(eq(archive.c_id, id))
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
