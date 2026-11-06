import { Elysia } from 'elysia'

import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { checkJWT } from '~/utils/check-jwt'
import { cookieValue } from '~/utils/elysia-request'

interface INamedCookie {
    value?: unknown
}

interface IAdminAuthContext {
    cookie: {
        b_user?: INamedCookie
        b_userid?: INamedCookie
        b_username?: INamedCookie
    }
}

interface IUserAuthContext {
    cookie: {
        user?: INamedCookie
        userid?: INamedCookie
        username?: INamedCookie
    }
}

/**
 * 校验后台管理员 Cookie JWT。失败抛出 403。
 */
export function assertAdminAuth(context: IAdminAuthContext): void {
    const { b_user, b_userid, b_username } = context.cookie
    const check = checkJWT(
        cookieValue(b_user?.value),
        cookieValue(b_userid?.value),
        cookieValue(b_username?.value),
        'admin',
    )
    if (!check) {
        throw new ApiError(API_CODE.FORBIDDEN, '登录验证失败')
    }
}

/**
 * 校验前台用户 Cookie JWT。失败抛出 403。
 */
export function assertUserAuth(context: IUserAuthContext): void {
    const { user, userid, username } = context.cookie
    const check = checkJWT(
        cookieValue(user?.value),
        cookieValue(userid?.value),
        cookieValue(username?.value),
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
