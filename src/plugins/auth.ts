import { Elysia } from 'elysia'

import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { checkJWT } from '~/utils/check-jwt'
import { cookieValue } from '~/utils/elysia-request'

interface INamedCookie {
    value?: unknown
}

interface IAdminAuthContext {
    request: Request
    cookie: {
        b_user?: INamedCookie
        b_userid?: INamedCookie
        b_username?: INamedCookie
    }
}

interface IUserAuthContext {
    request: Request
    cookie: {
        user?: INamedCookie
        userid?: INamedCookie
        username?: INamedCookie
    }
}

/**
 * Cookie 有值时用 Cookie，否则读取同名请求头，供 App 端携带登录响应里的凭证。
 */
function credential(fromCookie: unknown, request: Request, name: string): string {
    const cookieText = cookieValue(fromCookie)
    if (cookieText)
        return cookieText

    return request.headers.get(name)?.trim() ?? ''
}

/**
 * 校验后台管理员会话。Cookie 优先，同名请求头兜底。失败抛出 403。
 */
export function assertAdminAuth(context: IAdminAuthContext): void {
    const { b_user, b_userid, b_username } = context.cookie
    const check = checkJWT(
        credential(b_user?.value, context.request, 'b_user'),
        credential(b_userid?.value, context.request, 'b_userid'),
        credential(b_username?.value, context.request, 'b_username'),
        'admin',
    )
    if (!check) {
        throw new ApiError(API_CODE.FORBIDDEN, '登录验证失败')
    }
}

/**
 * 校验前台用户会话。Cookie 优先，同名请求头兜底。失败抛出 403。
 */
export function assertUserAuth(context: IUserAuthContext): void {
    const { user, userid, username } = context.cookie
    const check = checkJWT(
        credential(user?.value, context.request, 'user'),
        credential(userid?.value, context.request, 'userid'),
        credential(username?.value, context.request, 'username'),
        'user',
    )
    if (!check) {
        throw new ApiError(API_CODE.FORBIDDEN, '登录验证失败')
    }
}

/**
 * 后台管理员 Cookie JWT 鉴权守卫（挂到「其后全部为管理员接口」的路由上）。
 */
export function createAdminAuthGuard() {
    return new Elysia({ name: 'admin-auth-guard' })
        .guard({
            beforeHandle: assertAdminAuth,
        })
        .as('scoped')
}

/**
 * 前台用户 Cookie JWT 鉴权守卫（挂到「其后全部为用户接口」的路由上）。
 */
export function createUserAuthGuard() {
    return new Elysia({ name: 'user-auth-guard' })
        .guard({
            beforeHandle: assertUserAuth,
        })
        .as('scoped')
}
