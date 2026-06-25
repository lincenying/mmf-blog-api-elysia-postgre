import type { OtherPage, UserInsert, UserLogin, UserModify, UserModifyForm } from '~/schema/elysia-schema'

import { writeFileSync } from 'fs'
import { count, desc, eq } from 'drizzle-orm'
import md5 from 'md5'

import { config } from '~/config'
import { admins, db } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { fsExistsSync, getErrorMessage, getNowTime } from '~/utils'
import { withVirtualId } from '~/utils/db-mapper'
import { signSessionToken } from '~/utils/jwt-token'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'

/**
 * 后台管理员账号业务（Drizzle）。
 */
export class BackendUserService {
    /**
     * 获取管理员列表。
     */
    public static async getList(reqQuery: OtherPage) {
        const page = Number(reqQuery.page) || 1
        const limit = Number(reqQuery.limit) || 10
        const offset = (page - 1) * limit
        try {
            const [list, totalResult] = await Promise.all([
                db.select().from(admins).orderBy(desc(admins._id)).limit(limit).offset(offset),
                db.select({ value: count() }).from(admins),
            ])
            const total = Number(totalResult[0]?.value) ?? 0
            const totalPage = Math.ceil(total / limit)
            return {
                list: list.map(withVirtualId),
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
     * 获取单个管理员。
     */
    public static async getItem(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [result] = await db.select().from(admins).where(eq(admins._id, _id)).limit(1)
            return result ? withVirtualId(result) : null
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理员登录。
     */
    public static async login(reqBody: UserLogin) {
        const { password, username } = reqBody

        if (username === '' || password === '') {
            throw new ApiError(API_CODE.VALIDATION, '请输入用户名和密码')
        }

        try {
            const [result] = await db.select().from(admins).where(
                eq(admins.username, username),
            ).limit(1)

            if (result
                && result.password === md5(config.md5_salt + password)
                && result.is_delete === 0) {
                const mapped = withVirtualId(result)
                const _username = encodeURI(username)
                const token = signSessionToken({ id: mapped.id, username: _username }, 'admin')

                return {
                    user: token,
                    username: _username,
                    userid: mapped.id,
                }
            }
            throw new ApiError(API_CODE.VALIDATION, '用户名或者密码错误')
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理员退出。
     */
    public static logout() {
        return '退出成功'
    }

    /**
     * 初始化时添加管理员。
     */
    public static async insert(reqBody: UserInsert) {
        if (!reqBody.username || !reqBody.password || !reqBody.email) {
            return '请将表单填写完整'
        }
        if (fsExistsSync('./admin.lock')) {
            return '请先把项目根目录的 admin.lock 文件删除'
        }

        const { username, password, email } = reqBody
        let message = ''
        try {
            const [existing] = await db.select().from(admins).where(eq(admins.username, username)).limit(1)
            if (existing) {
                message = `${username}: 已经存在`
            }
            else {
                const data = {
                    _id: generateObjectId(),
                    username,
                    password: md5(config.md5_salt + password),
                    email,
                    creat_date: getNowTime(),
                    update_date: getNowTime(),
                    is_delete: 0,
                    timestamp: Number(getNowTime('X')),
                }
                await db.insert(admins).values(data)
                writeFileSync('./admin.lock', username)
                message = `添加用户成功: ${username}, 密码: ${password}`
            }
        }
        catch (err: unknown) {
            message = getErrorMessage(err)
        }
        return message
    }

    /**
     * 管理员编辑。
     */
    public static async modify(reqBody: UserModify) {
        const { id: _id, email, password, username } = reqBody

        const body: UserModifyForm = {
            email,
            username,
            update_date: getNowTime(),
        }
        if (password) {
            body.password = md5(config.md5_salt + password)
        }

        try {
            const [result] = await db.update(admins).set(body).where(eq(admins._id, _id)).returning()
            return result ? withVirtualId(result) : null
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理员删除。
     */
    public static async deletes(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        try {
            await db.update(admins).set({ is_delete: 1 }).where(eq(admins._id, _id))
            return '删除成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 管理员恢复。
     */
    public static async recover(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        try {
            await db.update(admins).set({ is_delete: 0 }).where(eq(admins._id, _id))
            return '恢复成功'
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }
}
