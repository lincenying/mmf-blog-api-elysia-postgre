import type { OtherPage, UserInsert, UserLogin, UserModify, UserModifyForm, UserPassword } from '~/schema/elysia-schema'

import { strLen } from '@lincy/utils'
import { and, count, desc, eq, ne } from 'drizzle-orm'
import md5 from 'md5'

import { config } from '~/config'
import { db, users } from '~/db'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { getErrorMessage, getNowTime } from '~/utils'
import { withoutPassword, withVirtualId } from '~/utils/db-mapper'
import { signSessionToken } from '~/utils/jwt-token'
import { generateObjectId, isValidObjectId } from '~/utils/object-id'
import { normalizePage } from '~/utils/page'
import { throwAsApiError } from '~/utils/service-error'

/**
 * 前台用户业务（Drizzle）。
 */
export class FrontendUserService {
    /**
     * 用户列表。
     */
    public static async getList(reqQuery: OtherPage) {
        const { page, limit, offset } = normalizePage(reqQuery.page, reqQuery.limit, 10)

        try {
            const [list, totalResult] = await Promise.all([
                db.select().from(users).orderBy(desc(users._id)).limit(limit).offset(offset),
                db.select({ value: count() }).from(users),
            ])
            const total = Number(totalResult[0]?.value) ?? 0
            const totalPage = Math.ceil(total / limit)
            return {
                list: list.map(row => withoutPassword(withVirtualId(row))),
                total,
                hasNext: totalPage > page ? 1 : 0,
                hasPrev: page > 1 ? 1 : 0,
            }
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取用户列表失败')
        }
    }

    /**
     * 用户登录。
     */
    public static async login(reqBody: UserLogin) {
        let { username } = reqBody

        const { password } = reqBody

        if (username === '' || password === '') {
            throw new ApiError(API_CODE.VALIDATION, '请输入用户名和密码')
        }

        try {
            const [result] = await db.select().from(users).where(
                eq(users.username, username),
            ).limit(1)

            if (result
                && result.password === md5(config.md5_salt + password)
                && result.is_delete === 0) {
                username = encodeURI(username)
                const mapped = withVirtualId(result)
                const token = signSessionToken({ id: mapped.id, username }, 'user')
                return {
                    user: token,
                    userid: mapped.id,
                    username,
                    useremail: result.email,
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
     * 用户退出。
     */
    public static logout() {
        return '退出成功'
    }

    /**
     * 用户注册。
     */
    public static async insert(reqBody: UserInsert) {
        const { email, password, username } = reqBody

        if (!username || !password || !email) {
            throw new ApiError(API_CODE.VALIDATION, '请将表单填写完整')
        }
        else if (strLen(username) < 4) {
            throw new ApiError(API_CODE.VALIDATION, '用户长度至少 2 个中文或 4 个英文')
        }
        else if (strLen(password) < 8) {
            throw new ApiError(API_CODE.VALIDATION, '密码长度至少 8 位')
        }
        else {
            try {
                const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1)
                if (existing) {
                    throw new ApiError(API_CODE.VALIDATION, '该用户名已经存在')
                }
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
                await db.insert(users).values(data)
                return '注册成功!'
            }
            catch (err: unknown) {
                if (err instanceof ApiError) {
                    throw err
                }
                throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
            }
        }
    }

    /**
     * 获取用户信息。
     */
    public static async getItem(userid: string) {
        if (!userid || !isValidObjectId(userid)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [result] = await db.select().from(users).where(eq(users._id, userid)).limit(1)
            if (!result)
                throw new ApiError(API_CODE.VALIDATION, '用户不存在')
            return withoutPassword(withVirtualId(result))
        }
        catch (err: unknown) {
            throwAsApiError(err, '获取用户详情失败')
        }
    }

    /**
     * 用户编辑。
     */
    public static async modify(reqBody: UserModify) {
        const { id, email, password, username } = reqBody

        if (!id || !isValidObjectId(id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        const body: UserModifyForm = {
            email,
            username,
            update_date: getNowTime(),
        }
        if (password) {
            body.password = md5(config.md5_salt + password)
        }

        try {
            const [duplicate] = await db.select({ _id: users._id })
                .from(users)
                .where(and(eq(users.username, username), ne(users._id, id)))
                .limit(1)
            if (duplicate)
                throw new ApiError(API_CODE.VALIDATION, '该用户名已经存在')

            const [result] = await db.update(users).set(body).where(eq(users._id, id)).returning()
            if (!result)
                throw new ApiError(API_CODE.VALIDATION, '用户不存在')
            return withoutPassword(withVirtualId(result))
        }
        catch (err: unknown) {
            throwAsApiError(err, '修改用户失败')
        }
    }

    /**
     * 当前登录用户资料（不含密码）。
     */
    public static async getAccount(user_id?: string) {
        if (!user_id) {
            throw new ApiError(API_CODE.VALIDATION, '请先登录')
        }

        try {
            const [result] = await db.select({
                _id: users._id,
                username: users.username,
                email: users.email,
                creat_date: users.creat_date,
                update_date: users.update_date,
                wx_avatar: users.wx_avatar,
                wx_signature: users.wx_signature,
            }).from(users).where(and(eq(users._id, user_id), eq(users.is_delete, 0))).limit(1)
            if (!result) {
                throw new ApiError(API_CODE.VALIDATION, '请先登录, 或者数据错误')
            }
            return {
                id: result._id,
                username: result.username,
                email: result.email,
                creat_date: result.creat_date,
                update_date: result.update_date,
                wx_avatar: result.wx_avatar,
                wx_signature: result.wx_signature,
            }
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 账号编辑。
     */
    public static async account(reqBody: { email: string }, user_id?: string) {
        if (!user_id) {
            throw new ApiError(API_CODE.VALIDATION, '请先登录')
        }

        const { email } = reqBody

        try {
            await db.update(users).set({ email }).where(eq(users._id, user_id))
            return { email }
        }
        catch (err: unknown) {
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 密码编辑。
     */
    public static async password(reqBody: UserPassword, user_id?: string) {
        if (!user_id) {
            throw new ApiError(API_CODE.VALIDATION, '请先登录')
        }

        const { old_password, password } = reqBody

        try {
            const [result] = await db.select().from(users).where(
                and(
                    eq(users._id, user_id),
                    eq(users.password, md5(config.md5_salt + old_password)),
                    eq(users.is_delete, 0),
                ),
            ).limit(1)

            if (result) {
                await db.update(users)
                    .set({ password: md5(config.md5_salt + password) })
                    .where(eq(users._id, user_id))
                return 'success'
            }
            throw new ApiError(API_CODE.VALIDATION, '原始密码错误')
        }
        catch (err: unknown) {
            if (err instanceof ApiError) {
                throw err
            }
            throw new ApiError(API_CODE.SERVER_ERROR, getErrorMessage(err))
        }
    }

    /**
     * 用户删除。
     */
    public static async deletes(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [updated] = await db.update(users).set({ is_delete: 1 }).where(eq(users._id, _id)).returning()
            if (!updated)
                throw new ApiError(API_CODE.VALIDATION, '用户不存在')
            return '删除成功'
        }
        catch (err: unknown) {
            throwAsApiError(err, '删除用户失败')
        }
    }

    /**
     * 用户恢复。
     */
    public static async recover(reqQuery: { id: string }) {
        const { id: _id } = reqQuery

        if (!_id || !isValidObjectId(_id)) {
            throw new ApiError(API_CODE.VALIDATION, '参数错误')
        }

        try {
            const [updated] = await db.update(users).set({ is_delete: 0 }).where(eq(users._id, _id)).returning()
            if (!updated)
                throw new ApiError(API_CODE.VALIDATION, '用户不存在')
            return '恢复成功'
        }
        catch (err: unknown) {
            throwAsApiError(err, '恢复用户失败')
        }
    }
}
