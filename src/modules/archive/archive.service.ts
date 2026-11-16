import type { ArchiveInsert, ArchiveModify, ArchivePage } from '~/schema/elysia-schema'

import { count, eq, type SQL } from 'drizzle-orm'

import { archive, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getNowTime } from '~/utils'
import { buildOrderBy, ilikeColumn } from '~/utils/drizzle-helpers'
import { normalizePage } from '~/utils/page'
import { throwAsApiError } from '~/utils/service-error'

/** 列表查询时排除正文，减轻传输体积。 */
const archiveListColumns = {
    c_id: archive.c_id,
    c_title: archive.c_title,
    c_intro: archive.c_intro,
    c_view: archive.c_view,
    c_posttime: archive.c_posttime,
}

/** 列表允许的排序字段。 */
const ARCHIVE_SORT_FIELDS = new Set(['c_id', 'c_posttime', 'c_view', 'c_title'])

/**
 * 只接受白名单内的排序字段，否则回到默认的 c_id 倒序。
 */
function resolveArchiveSort(sort: string | undefined) {
    const raw = sort || '-c_id'
    const descending = raw.startsWith('-')
    const field = descending ? raw.slice(1) : raw
    if (!ARCHIVE_SORT_FIELDS.has(field))
        return '-c_id'
    return descending ? `-${field}` : field
}

/**
 * 校验正整数 ID。
 */
function assertArchiveId(id: number) {
    if (!Number.isInteger(id) || id <= 0)
        throw new ApiError(API_CODE.VALIDATION, 'ID 参数错误')
}

/**
 * 校验非负整数浏览量。未传时返回 undefined。
 */
function optionalView(value: number | null | undefined) {
    if (value === undefined)
        return undefined
    if (value === null)
        return 0
    if (!Number.isInteger(value) || value < 0)
        throw new ApiError(API_CODE.VALIDATION, '浏览量参数错误')
    return value
}

/**
 * 归档内容业务（列表/详情公开；增删改由 Controller 层管理员守卫保护）。
 */
export class ArchiveService {
    /**
     * 分页获取归档列表（不含正文）。
     */
    public static async getList(reqQuery: ArchivePage) {
        const sort = resolveArchiveSort(reqQuery.sort)
        const { page, limit, offset } = normalizePage(reqQuery.page, reqQuery.limit, 15)
        const key = reqQuery.key?.trim() || ''

        const conditions: SQL[] = []
        if (key)
            conditions.push(ilikeColumn(archive.c_title, key))
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
            throwAsApiError(err, '获取归档列表失败')
        }
    }

    /**
     * 获取单条归档详情（含正文）。
     */
    public static async getItem(id: number) {
        assertArchiveId(id)

        try {
            const [result] = await db.select().from(archive).where(eq(archive.c_id, id)).limit(1)
            if (!result)
                throw new ApiError(API_CODE.NOT_FOUND, '归档不存在')
            return result
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取归档详情失败')
        }
    }

    /**
     * 新增归档。
     */
    public static async insert(body: ArchiveInsert) {
        const c_title = body.c_title.trim()
        if (!c_title)
            throw new ApiError(API_CODE.VALIDATION, '请输入标题')

        const c_view = optionalView(body.c_view) ?? 0

        try {
            const [result] = await db.insert(archive).values({
                c_title,
                c_intro: body.c_intro ?? '',
                c_content: body.c_content ?? '',
                c_view,
                c_posttime: getNowTime(),
            }).returning()
            return result
        }
        catch (err: unknown) {
            throwAsApiError(err, '新增归档失败')
        }
    }

    /**
     * 更新归档。未提交的字段保持原值。
     */
    public static async modify(id: number, body: ArchiveModify) {
        assertArchiveId(id)

        const c_title = body.c_title.trim()
        if (!c_title)
            throw new ApiError(API_CODE.VALIDATION, '请输入标题')

        const c_view = optionalView(body.c_view)

        try {
            const [existing] = await db.select({ c_id: archive.c_id }).from(archive).where(eq(archive.c_id, id)).limit(1)
            if (!existing)
                throw new ApiError(API_CODE.NOT_FOUND, '归档不存在')

            const [result] = await db.update(archive).set({
                c_title,
                ...(body.c_intro !== undefined ? { c_intro: body.c_intro ?? '' } : {}),
                ...(body.c_content !== undefined ? { c_content: body.c_content ?? '' } : {}),
                ...(c_view !== undefined ? { c_view } : {}),
            }).where(eq(archive.c_id, id)).returning()
            return result
        }
        catch (err: unknown) {
            throwAsApiError(err, '更新归档失败')
        }
    }

    /**
     * 删除归档。
     */
    public static async deletes(id: number) {
        assertArchiveId(id)

        try {
            const [existing] = await db.select({ c_id: archive.c_id }).from(archive).where(eq(archive.c_id, id)).limit(1)
            if (!existing)
                throw new ApiError(API_CODE.NOT_FOUND, '归档不存在')

            await db.delete(archive).where(eq(archive.c_id, id))
            return '删除成功'
        }
        catch (err: unknown) {
            throwAsApiError(err, '删除归档失败')
        }
    }
}
